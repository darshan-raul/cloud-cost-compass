# Cloud Compass — Security Notes (stub)

This document will be expanded in FX.4. Quick rules:

- No K8s `Secret` objects for app secrets — Vault Agent sidecars only.
- `tenant_id` from OIDC `sub`; never trust request body or query string.
- Roles checked in **both** UI and MCP wrappers (D2).
- Encrypted at rest in Postgres via `ENCRYPTION_KEY` (FX.2 upgrades to envelope encryption).
- Cloud credentials stored in Vault under `secret/tenants/{tenant_id}/providers/`.
