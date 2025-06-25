-- rds_instances table
CREATE TABLE rds_instances (
    id SERIAL PRIMARY KEY,
    role_name TEXT NOT NULL,
    instance_name TEXT NOT NULL,
    multiaz BOOLEAN NOT NULL,
    db_engine TEXT NOT NULL,
    instance_type TEXT NOT NULL,
    storage_type TEXT NOT NULL,
    storage_size_gb INTEGER NOT NULL,
    polled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ec2_instances table
CREATE TABLE ec2_instances (
    id SERIAL PRIMARY KEY,
    role_name TEXT NOT NULL,
    instance_name TEXT,
    instance_id TEXT NOT NULL,
    instance_type TEXT NOT NULL,
    polled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ebs_volumes table
CREATE TABLE ebs_volumes (
    id SERIAL PRIMARY KEY,
    role_name TEXT NOT NULL,
    ebs_name TEXT,
    attached_instance_id TEXT,
    storage_type TEXT NOT NULL,
    polled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
); 