# Cloud Cost Compass

Multi-tenant cloud cost analysis platform: MCP + RAG + Agent + Streamlit.

## Features

- **Multi-Cloud Support**: AWS (boto3), Azure, GCP via native SDKs
- **Natural Language Chat**: Query costs and resources using Minimax M2.7 via LangGraph agent
- **MCP Tool Server**: FastMCP server (port 8000) with AWS cost/resource tools
- **RAG-Powered Insights**: Context-grounded responses via Qdrant vector search + Minimax embeddings
- **Multi-Tenant Dashboard**: Streamlit UI with per-team data isolation via SSO/OIDC (Keycloak)
- **Vault Agent Sidecar**: All secrets (API keys, cloud credentials) rendered from HashiCorp Vault at runtime

## Architecture

```
Browser → Envoy Gateway → Streamlit (8501)
                              │
                         LangGraph Agent
                        ┌──────┴──────┐
                        │             │
              MCP Server (8000)  RAG Service (8001)
              ┌─────────┴──┐         │
         get_costs   get_resources  │
              │             │       ├─→ Qdrant (vectors)
         AWS CE API   boto3         ├─→ Minimax Embed API
              │             │       └─→ PostgreSQL (chat history)
```

All services use **Vault Agent sidecar** — secrets rendered to `emptyDir` volume, no K8s secret objects.

## Directory Structure

```
cloud-cost-compass/
├── app/                    # Streamlit application
│   ├── Home.py
│   ├── pages/             # costs, inventory, chat, settings
│   └── Dockerfile
├── mcp-server/            # FastMCP server (AWS tools)
│   ├── server.py
│   └── Dockerfile
├── rag-service/           # FastAPI (RAG + history)
│   ├── server.py
│   ├── routers/           # retrieve, ingest, history
│   ├── embed/             # Minimax embed client
│   └── Dockerfile
├── infra/
│   ├── k8s/               # Gateway API manifests
│   │   ├── 00-namespace.yaml
│   │   ├── 00-secrets.yaml
│   │   ├── 00-vault.yaml          # Vault server
│   │   ├── 00-1-keycloak.yaml     # Keycloak IdP
│   │   ├── 01-postgres.yaml
│   │   ├── 02-mcp-server.yaml     # Vault agent sidecar
│   │   ├── 03-streamlit.yaml      # Vault agent sidecar
│   │   ├── 04-gateway.yaml        # Envoy Gateway
│   │   ├── 05-migrations.yaml
│   │   ├── 06-rag-service.yaml   # Vault agent sidecar
│   │   └── 07-qdrant.yaml
│   └── kind/
├── migrations/
├── scripts/               # setup-kind.sh, deploy-eks.sh
└── docs/
```

## Setup

### Local Kind

```bash
./scripts/setup-kind.sh
```

### EKS

```bash
export REGISTRY=your-registry.example.com
./scripts/deploy-eks.sh
```

### Vault Secret Paths

| Path | Rendered As | Used By |
|---|---|---|
| `secret/minimax/api_key` | `MINIMAX_API_KEY` | All services |
| `secret/app/encryption_key` | `ENCRYPTION_KEY` | MCP server |
| `secret/tenants/{tenant_id}/aws.json` | `{tenant_id}/aws.json` in `/etc/secrets/tenants` | MCP server |

### Keycloak

Keycloak at `http://keycloak:8080/realms/cloud-cost-compass`. Realm: `cloud-cost-compass`.

## Development

```bash
cd mcp-server && pip install -r requirements.txt && python server.py
cd rag-service && pip install -r requirements.txt && python server.py
cd app && pip install -r requirements.txt && streamlit run Home.py
```

## MCP Tools

| Tool | Description |
|------|-------------|
| `get_costs` | Query AWS Cost Explorer by time range, service, granularity |
| `get_resources` | List EC2, S3, RDS resources |

## RAG Service Endpoints

| Endpoint | Method | Purpose |
|---|---|---|
| `/retrieve` | POST | Semantic search (embed query → Qdrant → chunk texts) |
| `/ingest` | POST | Ingest document (chunk → embed → Qdrant + Postgres) |
| `/history` | GET/POST | Chat history CRUD |
| `/health` | GET | Liveness |