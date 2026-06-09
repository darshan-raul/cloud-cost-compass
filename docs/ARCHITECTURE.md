# Cloud Compass — Architecture

> Replaces `ARCHITECTURE_PLAN.md` (which described the Streamlit/Phase 1-4 model). Greenfield vision is six domains × three clouds behind one agent + dashboard.

## Decisions

| Concern | Decision | Alternatives considered |
|---|---|---|
| Data layer | Native cloud SDKs (boto3, azure-mgmt, google-cloud-*) | Steampipe/Powerpipe |
| UI | **Refine + shadcn/ui (Vite + TS)** | Streamlit, Gradio, Next.js, Appsmith, Tooljet |
| Agent | LangGraph/LangChain + Minimax M2.7 | — |
| RAG vector DB | Qdrant (separate from pgvector) | pgvector only |
| RAG service | Standalone FastAPI on 8001 | — |
| MCP server topology | Single FastMCP server, namespaced tools | Per-domain / per-cloud servers |
| Multi-tenancy auth | OIDC (Keycloak self-hosted), tenant_id from `sub` | — |
| AuthZ | Roles checked in UI **and** MCP tool wrappers | UI-only or MCP-only |
| Secret store | Vault Agent sidecar → `emptyDir` (no K8s Secret objects) | K8s Secret objects |
| Infra | Kind (local), EKS (cloud), Gateway API (Envoy Gateway) | Nginx ingress |

## Topology

```
Browser
  │ HTTPS
  ▼
Envoy Gateway  ──►  app :8080  (Refine + shadcn/ui, nginx-served SPA + /api reverse proxy)
                       │
                       ├─ /api/mcp/*    → mcp-server :8000
                       ├─ /api/rag/*    → rag-service :8001
                       ├─ /api/alerts/* → alerts-service :8002  (Phase 3)
                       └─ /api/agent/*  → agent endpoint  (SSE to LangGraph)
```

Backend services:

| Service | Port | Phase | Purpose |
|---|---|---|---|
| vault | 8200 | 1 | Secret store (dev mode) |
| keycloak | 8080 | 1 | OIDC issuer; realm `cloud-compass`; roles `viewer`/`operator`/`admin` |
| postgres | 5432 | 1 | History, inventory, findings, SBOM, compliance, alerts |
| qdrant | 6333/6334 | 1 | Vector store (per-tenant collections) |
| mcp-server | 8000 | 1 | FastMCP, all namespaced tools (cost, finops, inventory, security, sca, compliance, alerts, auth) |
| app | 8080 | 1 | Refine + shadcn/ui dashboard; nginx serves static + proxies `/api/*` |
| rag-service | 8001 | 1 | `/retrieve`, `/ingest`, `/history`, `/security_kb`, `/compliance_kb`, `/cve` |
| alerts-service | 8002 | 3 | Rules, channels, recent events |
| cronjobs | — | 2/3 | inventory-snapshot, cve-sync, anomaly-eval, compliance-evidence |

## MCP Tool Surface

Namespaced, single server. Every tool is tenant-scoped and role-checked.

- **auth**: `auth.whoami`
- **cost**: `cost.get_costs`, `cost.get_forecast`
- **finops**: `finops.get_rightsizing`, `finops.get_reservation_coverage`, `finops.get_reservation_utilization`, `finops.get_idle_resources`
- **inventory**: `inventory.list_resources`, `inventory.get_tag_coverage`, `inventory.get_unused_resources`
- **security**: `security.list_findings`, `security.get_iam_anomalies`, `security.get_public_assets`, `security.get_encryption_status`
- **sca**: `sca.list_vulnerabilities`, `sca.get_sbom`, `sca.ingest_sbom`, `sca.sync_cve_feed`
- **compliance**: `compliance.list_frameworks`, `compliance.get_control_status`, `compliance.generate_evidence`
- **alerts**: `alerts.list_rules`, `alerts.create_rule`, `alerts.delete_rule`, `alerts.list_events`, `alerts.test_channel`

## Provider Abstraction

```
mcp-server/
  providers/
    base.py        # CloudProvider protocol
    aws.py         # boto3
    azure.py       # azure-mgmt, azure-identity
    gcp.py         # google-cloud-*
    factory.py     # providers_for(tenant_id) -> list[CloudProvider]
```

The factory reads `secret/tenants/{tenant_id}/providers/{aws,azure,gcp}.json` from the rendered Vault volume and instantiates only the providers that have credentials.

## Multi-tenancy rules

- `tenant_id` from verified OIDC `sub` claim, never from request body/header.
- Every Postgres query: `WHERE tenant_id = %s`.
- Every Qdrant call: `rag-{tid}`, `kb-{tid}-*`, `cve-{tid}`.
- Every Vault read: `secret/tenants/{tenant_id}/...`.
- MCP server injects `tenant_id` + `role` from the verified token.
- Role checks happen in **both** UI and MCP wrappers.

## RAG

- Embedding: Minimax `embo` (384 dim, DOT similarity).
- Chunking: 512-char fixed, 50-char overlap.
- Collections: `rag-{tid}`, `kb-{tid}-security`, `kb-{tid}-compliance`, `cve-{tid}`.
- RAG endpoints: `/retrieve`, `/ingest`, `/history`, `/security_kb`, `/compliance_kb`, `/cve`.

## Phases

1. **Foundation** — auth, cost + inventory across AWS/Azure/GCP, RAG chat, UI scaffold.
2. **Security + FinOps** — CSPM, IAM drift, rightsizing, reservations; security/FinOps pages.
3. **SCA + Compliance + Alerts** — SBOM, CVE/KEV, framework packs, anomaly detection, Slack.

Full tracker in `AGENTS.md`.
