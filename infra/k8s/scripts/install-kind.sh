#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CHART_DIR="$(dirname "$SCRIPT_DIR")/charts/cloud-cost-compass"

echo "=== Installing Cloud Cost Compass on Kind ==="

echo "==> Adding Helm repos"
helm repo add hashicorp https://helm.releases.hashicorp.com --quiet
helm repo add bitnami https://charts.bitnami.com/bitnami --quiet
helm repo add cnpg https://helm.cloudnative-pg.com --quiet
helm repo update

echo "==> Creating namespace"
kubectl create namespace cloud-cost-compass --dry-run=client -o yaml | kubectl apply -f -

echo "==> Installing chart"
helm upgrade --install ccc "$CHART_DIR" \
  --namespace cloud-cost-compass \
  --create-namespace \
  --values "$CHART_DIR/values-kind.yaml" \
  --wait --timeout 10m

echo "==> Setting up Keycloak realm import ConfigMap"
kubectl create configmap keycloak-realm \
  --from-file=ccc-realm.json="$CHART_DIR/../keycloak/ccc-realm.json" \
  --namespace cloud-cost-compass \
  --dry-run=client -o yaml | kubectl apply -f -

echo "==> Waiting for Keycloak to be ready"
kubectl rollout status deployment keycloak --namespace cloud-cost-compass --timeout=120s || true

echo "==> Running migrations"
kubectl wait --for=condition=complete job/ccc-db-migrations --namespace cloud-cost-compass --timeout=120s || true

echo ""
echo "=== Installation complete ==="
echo "Keycloak: http://keycloak.cloud-cost-compass.svc:8080"
echo "Streamlit: http://localhost:8501 (via gateway)"
echo "Vault: http://vault.cloud-cost-compass.svc:8200"
echo ""
echo "Admin credentials: admin/admin"
echo "Vault token: vault-root-token"