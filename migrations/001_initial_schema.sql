-- Migration 001: Initial schema (v2 — vectors moved to Qdrant)

CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    oidc_subject TEXT UNIQUE NOT NULL,
    aws_account_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tenant_credentials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    provider TEXT NOT NULL CHECK (provider IN ('aws', 'azure', 'gcp')),
    encrypted_blob BYTEA NOT NULL,
    k8s_secret_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id, provider)
);

CREATE TABLE IF NOT EXISTS cost_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    service TEXT NOT NULL,
    amount NUMERIC(20, 6) NOT NULL,
    currency TEXT DEFAULT 'USD',
    unit TEXT,
    blended_cost NUMERIC(20, 6),
    unblended_cost NUMERIC(20, 6),
    usage_quantity NUMERIC(20, 6),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id, date, service)
);

CREATE INDEX IF NOT EXISTS idx_cost_history_tenant_date ON cost_history(tenant_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_cost_history_service ON cost_history(service);

CREATE TABLE IF NOT EXISTS resource_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    resource_type TEXT NOT NULL,
    resource_id TEXT NOT NULL,
    region TEXT,
    tags JSONB DEFAULT '{}',
    status TEXT,
    captured_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_resource_snapshots_tenant_type ON resource_snapshots(tenant_id, resource_type);
CREATE INDEX IF NOT EXISTS idx_resource_snapshots_captured ON resource_snapshots(captured_at DESC);

-- RAG document metadata (vector data lives in Qdrant)
CREATE TABLE IF NOT EXISTS rag_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    source TEXT NOT NULL,
    source_type TEXT CHECK (source_type IN ('upload', 'scraped', 'builtin')),
    chunk_count INT DEFAULT 0,
    qdrant_collection TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chat history (managed by RAG service)
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    session_id TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_session ON chat_messages(tenant_id, session_id, created_at);