#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CHART_DIR="$(dirname "$SCRIPT_DIR")/charts/cloud-cost-compass"

echo "=== Uninstalling Cloud Cost Compass ==="

echo "==> Uninstalling Helm release"
helm uninstall ccc --namespace cloud-cost-compass --wait || true

echo "==> Deleting namespace"
kubectl delete namespace cloud-cost-compass --wait || true

echo "==> Cleaning up Helm repos (optional)"
# helm repo remove hashicorp bitnami cnpg

echo "=== Uninstallation complete ==="