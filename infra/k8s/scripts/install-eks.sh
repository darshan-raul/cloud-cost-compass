#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CHART_DIR="$(dirname "$SCRIPT_DIR")/charts/cloud-cost-compass"
ECR_REGISTRY="${ECR_REGISTRY:-123456789012.dkr.ecr.us-west-2.amazonaws.com}"

echo "=== Installing Cloud Cost Compass on EKS ==="

echo "==> Adding Helm repos"
helm repo add hashicorp https://helm.releases.hashicorp.com --quiet
helm repo add bitnami https://charts.bitnami.com/bitnami --quiet
helm repo add cnpg https://helm.cloudnative-pg.com --quiet
helm repo update

echo "==> Creating namespace"
kubectl create namespace cloud-cost-compass --dry-run=client -o yaml | kubectl apply -f -

echo "==> Creating ECR pull secret if needed"
if [ ! "$(kubectl get secret ecr-registry-secret --namespace cloud-cost-compass --no-headers 2>/dev/null)" ]; then
  aws ecr get-login-password --region us-west-2 | \
    helm registry login --username AWS "$ECR_REGISTRY" 2>/dev/null || true
  kubectl create secret docker-registry ecr-registry-secret \
    --namespace cloud-cost-compass \
    --docker-server="${ECR_REGISTRY}" \
    --docker-username=AWS \
    --docker-password="$(aws ecr get-authorization-token --region us-west-2 --output text --query AuthorizationData[].authorizationToken | base64 -d | cut -d: -f2)" \
    --dry-run=client -o yaml | kubectl apply -f -
fi

echo "==> Installing chart with ECR overrides"
helm upgrade --install ccc "$CHART_DIR" \
  --namespace cloud-cost-compass \
  --create-namespace \
  --values "$CHART_DIR/values-prod.yaml" \
  --set global.ecrRegistry="$ECR_REGISTRY" \
  --wait --timeout 15m

echo "==> Setting up Keycloak realm import ConfigMap"
kubectl create configmap keycloak-realm \
  --from-file=ccc-realm.json="$CHART_DIR/../keycloak/ccc-realm.json" \
  --namespace cloud-cost-compass \
  --dry-run=client -o yaml | kubectl apply -f -

echo "==> Waiting for Keycloak to be ready"
kubectl rollout status deployment keycloak --namespace cloud-cost-compass --timeout=180s || true

echo "==> Waiting for Postgres Cluster to be ready"
kubectl wait cluster ccc-postgres --namespace cloud-cost-compass --for=condition=ClusterReady --timeout=300s || true

echo "==> Running migrations"
kubectl wait --for=condition=complete job/ccc-db-migrations --namespace cloud-cost-compass --timeout=180s || true

echo ""
echo "=== Installation complete ==="
echo "Keycloak: https://keycloak.cloud-cost-compass.example.com"
echo "Streamlit: https://cloud-cost-compass.example.com"
echo "Vault: http://vault.cloud-cost-compass.svc:8200"
echo "Postgres: ccc-postgres.cloud-cost-compass.svc:5432"
echo ""
echo "Update your /etc/hosts or DNS for the ingress hostnames"
echo "Admin credentials: admin/admin (update in production!)"
echo "Vault token: vault-root-token (update in production!)"