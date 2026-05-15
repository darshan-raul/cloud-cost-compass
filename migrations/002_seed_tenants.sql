-- Migration 002: Keycloak realm initialization
-- Run manually or via init job

INSERT INTO tenants (id, name, oidc_subject, aws_account_id)
VALUES
    ('00000000-0000-0000-0000-000000000001', 'Admin Tenant', 'admin', NULL)
ON CONFLICT (oidc_subject) DO NOTHING;