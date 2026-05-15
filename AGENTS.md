# Cloud Cost Compass

Multi-tenant cloud cost analysis platform: MCP + RAG + Agent + Streamlit.

**Stack:** Streamlit (UI), LangGraph/LangChain (agent), Minimax M2.7 (LLM), MCP server (tools), Qdrant (RAG vector store), PostgreSQL (history), native cloud SDKs (boto3, Azure, GCP).

## Non-obvious commands

```bash
# Local Kind setup
./scripts/setup-kind.sh

# EKS deployment
./scripts/deploy-eks.sh

# Build images
docker build -t cloud-cost-compass/app:latest -f app/Dockerfile app/
docker build -t cloud-cost-compass/mcp-server:latest -f mcp-server/Dockerfile mcp-server/
docker build -t cloud-cost-compass/rag-service:latest -f rag-service/Dockerfile rag-service/

# Kind image load
kind load docker-image cloud-cost-compass/app:latest --name cloud-cost-compass
kind load docker-image cloud-cost-compass/mcp-server:latest --name cloud-cost-compass
kind load docker-image cloud-cost-compass/rag-service:latest --name cloud-cost-compass
kind load docker-image qdrant/qdrant:v1.7.4 --name cloud-cost-compass
kind load docker-image hashicorp/vault:1.16 --name cloud-cost-compass
```

## Architecture

- **Streamlit** (port 8501): Dashboard — /costs, /inventory, /chat, /settings
- **MCP Server** (port 8000): FastMCP, tools for AWS cost/resource queries (boto3 CE, EC2, S3, RDS)
- **RAG Service** (port 8001): Document ingestion + semantic search + chat history
- **Qdrant** (port 6334): Vector store for RAG embeddings
- **Vault** (port 8200): Secret store — Agent sidecar renders secrets to `emptyDir` volume
- **PostgreSQL** (port 5432): Cost history, resource snapshots, RAG document metadata, chat history

## Multi-tenancy

- Auth via SSO/OIDC (Keycloak self-hosted)
- `tenant_id` extracted from OIDC token `sub` claim
- Each tenant's cloud credentials stored in Vault (`secret/tenants/{tenant_id}/aws.json`)
- All SDK calls scoped by `tenant_id` — no cross-tenant data leakage

## Secrets (Vault Agent Sidecar)

Vault Agent runs as a sidecar in each pod. It renders secrets to an `emptyDir` volume mounted at the app container's `SECRETS_DIR`. App containers read secrets from the rendered directory — **no K8s secret objects used for app secrets**.

Secret paths in Vault:
- `secret/minimax/api_key` → rendered to `MINIMAX_API_KEY`
- `secret/app/encryption_key` → rendered to `ENCRYPTION_KEY`
- `secret/tenants/{tenant_id}/aws.json` → rendered per-tenant AWS credentials

## RAG

- `tenant_id` scoped chunking and retrieval
- Sources: cloud billing docs (scraped) + tenant-uploaded cost reports
- Embedding: Minimax embed API (`embo`, 384 dim)
- Chunking: 512-char fixed with 50-char overlap
- Vector store: Qdrant (one collection per tenant: `rag-{tenant_id}`)

## K8s deploy order

Files prefixed to enforce ordering: `00-namespace.yaml` → `00-secrets.yaml` → `00-vault.yaml` → `00-1-keycloak.yaml` → `01-postgres.yaml` → `02-mcp-server.yaml` → `03-streamlit.yaml` → `04-gateway.yaml` → `05-migrations.yaml` → `06-rag-service.yaml` → `07-qdrant.yaml`. Apply the whole directory.

## Gateway API

Envoy Gateway handles ingress on Kind. `04-gateway.yaml` creates a Gateway and HTTPRoute routing `/` to Streamlit (8501).

## No test/lint/build scripts

Pure IaC + Docker. No npm scripts, test suites, or lint commands.