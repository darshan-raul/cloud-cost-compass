import streamlit as st
import httpx
import pandas as pd
import plotly.express as px
from datetime import datetime, timedelta
import os

MCP_SERVER_URL = os.getenv("MCP_SERVER_URL", "http://mcp-server:8000")

st.set_page_config(page_title="Costs | Cloud Cost Compass", page_icon="💰")

if "tenant_id" not in st.session_state:
    st.warning("Please log in from home page")
    st.stop()

tenant_id = st.session_state.tenant_id

st.title("💰 Cost Analytics")

col1, col2, col3 = st.columns(3)
with col1:
    start_date = st.date_input("Start", datetime.now() - timedelta(days=30))
with col2:
    end_date = st.date_input("End", datetime.now())
with col3:
    granularity = st.selectbox("Granularity", ["DAILY", "MONTHLY", "HOURLY"])

if st.button("Fetch Costs"):
    with st.spinner("Fetching cost data..."):
        try:
            response = httpx.post(
                f"{MCP_SERVER_URL}/tools/get_costs",
                headers={"x-tenant-id": tenant_id},
                json={
                    "params": {
                        "start_date": start_date.isoformat(),
                        "end_date": end_date.isoformat(),
                        "granularity": granularity
                    }
                },
                timeout=30.0
            )
            if response.status_code == 200:
                data = response.json()
                st.session_state.cost_data = data
                st.success(f"Fetched {len(data.get('data', []))} cost entries")
            else:
                st.error(f"Error: {response.text}")
        except Exception as e:
            st.error(f"Connection error: {e}")

if "cost_data" in st.session_state:
    data = st.session_state.cost_data
    df = pd.DataFrame(data.get("data", []))
    if not df.empty:
        df_plot = df[df["metric"] == "UnblendedCost"].copy()
        df_plot["date"] = pd.to_datetime(df_plot["period_start"])
        fig = px.line(df_plot, x="date", y="value", title="Unblended Cost Over Time")
        st.plotly_chart(fig)
        st.dataframe(df)
    else:
        st.info("No cost data available")