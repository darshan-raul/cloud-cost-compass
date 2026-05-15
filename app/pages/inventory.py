import streamlit as st
import httpx
import pandas as pd
import os

MCP_SERVER_URL = os.getenv("MCP_SERVER_URL", "http://mcp-server:8000")

st.set_page_config(page_title="Inventory | Cloud Cost Compass", page_icon="📦")

if "tenant_id" not in st.session_state:
    st.warning("Please log in from home page")
    st.stop()

tenant_id = st.session_state.tenant_id

st.title("📦 Resource Inventory")

resource_filter = st.multiselect(
    "Resource Type",
    ["ec2", "s3", "rds"],
    default=["ec2"]
)

if st.button("Fetch Resources"):
    with st.spinner("Fetching resources..."):
        try:
            response = httpx.post(
                f"{MCP_SERVER_URL}/tools/get_resources",
                headers={"x-tenant-id": tenant_id},
                json={"params": {"resource_types": resource_filter}},
                timeout=30.0
            )
            if response.status_code == 200:
                data = response.json()
                st.session_state.resources = data.get("resources", [])
                st.success(f"Found {len(st.session_state.resources)} resources")
            else:
                st.error(f"Error: {response.text}")
        except Exception as e:
            st.error(f"Connection error: {e}")

if "resources" in st.session_state:
    resources = st.session_state.resources
    if resource_filter:
        resources = [r for r in resources if r["type"] in resource_filter]
    df = pd.DataFrame(resources)
    if not df.empty:
        st.dataframe(df)
        st.write(f"Total: {len(resources)}")
    else:
        st.info("No resources found")