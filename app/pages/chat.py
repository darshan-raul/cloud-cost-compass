import streamlit as st
import httpx
import os
from datetime import datetime

RAG_SERVICE_URL = os.getenv("RAG_SERVICE_URL", "http://rag-service:8001")
MINIMAX_API_KEY = os.getenv("MINIMAX_API_KEY", "")
MINIMAX_API_BASE = os.getenv("MINIMAX_API_BASE", "https://api.minimax.chat")
MCP_SERVER_URL = os.getenv("MCP_SERVER_URL", "http://mcp-server:8000")

st.set_page_config(page_title="Chat | Cloud Cost Compass", page_icon="💬")

if "tenant_id" not in st.session_state:
    st.warning("Please log in from home page")
    st.stop()

tenant_id = st.session_state.tenant_id

if "session_id" not in st.session_state:
    st.session_state.session_id = str(datetime.now().timestamp())

st.title("💬 Cost Assistant")

def load_history():
    try:
        resp = httpx.get(
            f"{RAG_SERVICE_URL}/history",
            headers={"x-tenant-id": tenant_id},
            params={"session_id": st.session_state.session_id},
            timeout=10.0
        )
        if resp.status_code == 200:
            return resp.json()
    except Exception:
        pass
    return []

def save_message(role: str, content: str):
    try:
        httpx.post(
            f"{RAG_SERVICE_URL}/history",
            headers={"x-tenant-id": tenant_id},
            json={"session_id": st.session_state.session_id, "role": role, "content": content},
            timeout=10.0
        )
    except Exception:
        pass

def rag_retrieve(query: str, top_k: int = 5) -> str:
    try:
        resp = httpx.post(
            f"{RAG_SERVICE_URL}/retrieve",
            headers={"x-tenant-id": tenant_id},
            json={"query": query, "top_k": top_k},
            timeout=30.0
        )
        if resp.status_code == 200:
            data = resp.json()
            chunks = data.get("chunks", [])
            if chunks:
                return "\n\n".join(c["chunk_text"] for c in chunks)
    except Exception:
        pass
    return ""

def rag_ingest(source: str, content: str):
    try:
        httpx.post(
            f"{RAG_SERVICE_URL}/ingest",
            headers={"x-tenant-id": tenant_id},
            json={"source": source, "source_type": "upload", "content": content},
            timeout=30.0
        )
    except Exception:
        pass

if "messages_loaded" not in st.session_state:
    history = load_history()
    if history:
        st.session_state.messages = [
            {"role": msg["role"], "content": msg["content"]}
            for msg in history
        ]
    else:
        st.session_state.messages = [
            {"role": "assistant", "content": "Ask me about your cloud costs and resources. I can help you understand spending patterns, find expensive resources, and more."}
        ]
    st.session_state.messages_loaded = True

for msg in st.session_state.messages:
    with st.chat_message(msg["role"]):
        st.markdown(msg["content"])

prompt = st.chat_input("Ask about your cloud costs...")

if prompt:
    st.session_state.messages.append({"role": "user", "content": prompt})
    with st.chat_message("user"):
        st.markdown(prompt)
    save_message("user", prompt)

    with st.chat_message("assistant"):
        with st.spinner("Thinking..."):
            try:
                rag_context = rag_retrieve(prompt)
                cost_resp = httpx.post(
                    f"{MCP_SERVER_URL}/tools/get_costs",
                    headers={"x-tenant-id": tenant_id},
                    json={"params": {"start_date": "2024-01-01", "end_date": datetime.now().strftime("%Y-%m-%d")}},
                    timeout=30.0
                )
                cost_data = cost_resp.json() if cost_resp.status_code == 200 else {}

                system_prompt = "You are a cloud cost analyst. "
                if rag_context:
                    system_prompt += f"Context from knowledge base:\n{rag_context}\n\n"
                system_prompt += f"Cost data:\n{cost_data}"

                response = httpx.post(
                    f"{MINIMAX_API_BASE}/v1/text/chatcompletion_v2",
                    headers={"Authorization": f"Bearer {MINIMAX_API_KEY}"},
                    json={
                        "model": "Minimax/M2.7",
                        "messages": [
                            {"role": "system", "content": system_prompt},
                            {"role": "user", "content": prompt}
                        ]
                    },
                    timeout=60.0
                )
                if response.status_code == 200:
                    result = response.json()
                    answer = result.get("choices", [{}])[0].get("message", {}).get("content", "")
                    st.markdown(answer)
                    st.session_state.messages.append({"role": "assistant", "content": answer})
                    save_message("assistant", answer)
                else:
                    st.error(f"LLM error: {response.text}")
            except Exception as e:
                st.error(f"Error: {e}")