import os
import time
import boto3
import psycopg2
from datetime import datetime
from botocore.exceptions import ClientError

ROLES = os.getenv("AWS_ROLES", "").split(",")  # Comma-separated role ARNs
DB_CONN = {
    "host": "POSTGRES_HOST",
    "port": "POSTGRES_PORT",
    "dbname": "POSTGRES_DB",
    "user": "POSTGRES_USER",
    "password": "POSTGRES_PASSWORD"
}

def assume_role(role_arn):
    sts = boto3.client('sts')
    creds = sts.assume_role(RoleArn=role_arn, RoleSessionName="CloudCostCompass")['Credentials']
    session = boto3.Session(
        aws_access_key_id=creds['AccessKeyId'],
        aws_secret_access_key=creds['SecretAccessKey'],
        aws_session_token=creds['SessionToken']
    )
    return session

def get_db_conn():
    return psycopg2.connect(**DB_CONN)

def poll_rds(session, role_name):
    rds = session.client('rds')
    dbs = rds.describe_db_instances()['DBInstances']
    data = []
    for db in dbs:
        data.append((
            role_name,
            db['DBInstanceIdentifier'],
            db.get('MultiAZ', False),
            db['Engine'],
            db['DBInstanceClass'],
            db['StorageType'],
            db['AllocatedStorage']
        ))
    return data

def poll_ec2(session, role_name):
    ec2 = session.resource('ec2')
    data = []
    for inst in ec2.instances.all():
        name = next((tag['Value'] for tag in inst.tags or [] if tag['Key'] == 'Name'), None)
        data.append((
            role_name,
            name,
            inst.id,
            inst.instance_type
        ))
    return data

def poll_ebs(session, role_name):
    ec2 = session.resource('ec2')
    data = []
    for vol in ec2.volumes.all():
        name = next((tag['Value'] for tag in vol.tags or [] if tag['Key'] == 'Name'), None)
        attached_instance_id = vol.attachments[0]['InstanceId'] if vol.attachments else None
        data.append((
            role_name,
            name,
            attached_instance_id,
            vol.volume_type
        ))
    return data

def insert_data(table, columns, data):
    if not data:
        return
    conn = get_db_conn()
    cur = conn.cursor()
    args_str = ','.join(cur.mogrify(f"({','.join(['%s']*len(columns))})", row).decode() for row in data)
    cur.execute(f"INSERT INTO {table} ({','.join(columns)}) VALUES {args_str}")
    conn.commit()
    cur.close()
    conn.close()

def main():
    while True:
        for role_arn in ROLES:
            try:
                session = assume_role(role_arn)
                role_name = role_arn.split('/')[-1]
                # RDS
                rds_data = poll_rds(session, role_name)
                insert_data('rds_instances',
                            ['role_name', 'instance_name', 'multiaz', 'db_engine', 'instance_type', 'storage_type', 'storage_size_gb'],
                            rds_data)
                # EC2
                ec2_data = poll_ec2(session, role_name)
                insert_data('ec2_instances',
                            ['role_name', 'instance_name', 'instance_id', 'instance_type'],
                            ec2_data)
                # EBS
                ebs_data = poll_ebs(session, role_name)
                insert_data('ebs_volumes',
                            ['role_name', 'ebs_name', 'attached_instance_id', 'storage_type'],
                            ebs_data)
            except ClientError as e:
                print(f"Error with role {role_arn}: {e}")
        time.sleep(6 * 60 * 60)  # 6 hours

if __name__ == "__main__":
    main() 