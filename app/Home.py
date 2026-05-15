import os
import streamlit as st
from jose import jwt, JWTError
import httpx
import time

KEYCLOAK_URL = os.getenv("KEYCLOAK_URL", "http://keycloak:8080/realms/cloud-cost-compass")
JWKS_URI = f"{KEYCLOAK_URL}/protocol/openid-connect/certs"
AUTH0_CLIENT_ID = os.getenv("AUTH0_CLIENT_ID", "cloud-cost-compass")
AUTH0_CLIENT_SECRET = os.getenv("AUTH0_CLIENT_SECRET", "")
ALGORITHMS = ["RS256"]

st.set_page_config(page_title="Cloud Cost Compass", page_icon="💰")

def get_token_from_header():
    auth_header = st.runtime.scriptrunner.get_query_params().get("Authorization", [""])[0]
    if auth_header and auth_header.startswith("Bearer "):
        return auth_header[7:]
    return None

def validate_token(token: str) -> dict | None:
    try:
        jwks = httpx.get(JWKS_URI, timeout=10).json()
        header = jwt.get_unverified_header(token)
        key = next((k for k in jwks["keys"] if k["kid"] == header["kid"]), None)
        if not key:
            return None
        unverified = jwt.get_unverified_claims(token)
        exp = unverified.get("exp", 0)
        if time.time() > exp:
            return None
        return unverified
    except Exception:
        return None

def login():
    st.title("Cloud Cost Compass")
    st.write("Sign in with your SSO provider")
    st.button("Login with Keycloak", type="primary")
    st.info("Redirects to Keycloak. Contact your admin if you can't access.")

if "tenant_id" not in st.session_state:
    st.session_state.tenant_id = None
    st.session_state.user = None

token = get_token_from_header()
if token:
    claims = validate_token(token)
    if claims:
        st.session_state.tenant_id = claims.get("sub")
        st.session_state.user = claims.get("preferred_username", claims.get("email", "unknown"))
    else:
        st.error("Invalid or expired token")

if not st.session_state.tenant_id:
    login()
else:
    st.switch_page("pages/costs.py")