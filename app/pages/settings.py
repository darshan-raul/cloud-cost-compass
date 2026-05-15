import streamlit as st
import os

RAG_SERVICE_URL = os.getenv("RAG_SERVICE_URL", "http://rag-service:8001")

st.set_page_config(page_title="Settings | Cloud Cost Compass", page_icon="⚙️")

if "tenant_id" not in st.session_state:
    st.warning("Please log in from home page")
    st.stop()

tenant_id = st.session_state.tenant_id

st.title("⚙️ Tenant Settings")

st.write(f"**Tenant ID:** `{tenant_id}`")

st.header("Cloud Credentials")
st.info("AWS credentials are managed via Kubernetes secrets. Contact your administrator to update.")

st.header("RAG Knowledge Base")

uploaded = st.file_uploader(
    "Upload cost reports, docs, or runbooks for context-grounded answers",
    type=["pdf", "csv", "txt"]
)

if uploaded:
    content = ""
    if uploaded.type == "text/plain":
        content = uploaded.read().decode("utf-8")
    elif uploaded.type == "text/csv":
        content = uploaded.read().decode("utf-8")
    else:
        st.warning(f"Unsupported file type: {uploaded.type}. Upload .txt or .csv files.")

    if content:
        with st.spinner("Ingesting document..."):
            try:
                import httpx
                resp = httpx.post(
                    f"{RAG_SERVICE_URL}/ingest",
                    headers={"x-tenant-id": tenant_id},
                    json={"source": uploaded.name, "source_type": "upload", "content": content},
                    timeout=60.0
                )
                if resp.status_code == 200:
                    data = resp.json()
                    st.success(f"Ingested: {uploaded.name} ({data.get('chunks_ingested', 0)} chunks)")
                else:
                    st.error(f"Ingest failed: {resp.text}")
            except Exception as e:
                st.error(f"Connection error: {e}")

st.header("User Info")
st.json(st.session_state.get("user", {}))