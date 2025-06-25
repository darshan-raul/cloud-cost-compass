import streamlit as st
import psycopg2
import pandas as pd
import os

DB_CONN = {
    "host": "POSTGRES_HOST",
    "port": "POSTGRES_PORT",
    "dbname": "POSTGRES_DB",
    "user": "POSTGRES_USER",
    "password": "POSTGRES_PASSWORD"
}

def get_conn():
    return psycopg2.connect(**DB_CONN)

def load_data(query):
    conn = get_conn()
    df = pd.read_sql(query, conn)
    conn.close()
    return df

st.title("Cloud Cost Compass Dashboard")
tab1, tab2, tab3 = st.tabs(["RDS", "EC2", "EBS"])

with tab1:
    st.header("RDS Dashboard")
    df = load_data("SELECT * FROM rds_instances")
    st.metric("Number of DBs", len(df))
    st.subheader("DBs per Role")
    st.bar_chart(df.groupby("role_name").size())
    st.subheader("Grouped by MultiAZ")
    st.bar_chart(df.groupby("multiaz").size())
    st.subheader("Grouped by Instance Type")
    st.bar_chart(df.groupby("instance_type").size())
    st.subheader("Grouped by DB Engine")
    st.bar_chart(df.groupby("db_engine").size())

with tab2:
    st.header("EC2 Dashboard")
    df = load_data("SELECT * FROM ec2_instances")
    st.metric("Number of Instances", len(df))
    st.subheader("Instances per Role")
    st.bar_chart(df.groupby("role_name").size())
    st.subheader("Grouped by Instance Type")
    st.bar_chart(df.groupby("instance_type").size())
    st.subheader("All Instances (filterable)")
    st.dataframe(df)

with tab3:
    st.header("EBS Dashboard")
    df = load_data("SELECT * FROM ebs_volumes")
    st.metric("Number of EBS", len(df))
    st.metric("Total Storage (GB)", df.shape[0])  # You can add storage size if you collect it
    st.subheader("Grouped by Storage Type")
    st.bar_chart(df.groupby("storage_type").size())
    st.subheader("All EBS Volumes (filterable)")
    st.dataframe(df) 