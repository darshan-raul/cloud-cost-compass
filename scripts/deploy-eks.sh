#!/bin/bash
set -e

NAMESPACE="cloud-cost-compass"

echo "=== Deploying to EKS ==="

REGISTRY="${REGISTRY:-your-registry.example.com}"

echo "Building and pushing Docker images..."
docker build -t cloud-cost-compass/mcp-server:latest -f mcp-server/Dockerfile mcp-server/
docker build -t cloud-cost-compass/app:latest -f app/Dockerfile app/
docker build -t cloud-cost-compass/rag-service:latest -f rag-service/Dockerfile rag-service/

docker tag cloud-cost-compass/mcp-server:latest $REGISTRY/mcp-server:latest
docker tag cloud-cost-compass/app:latest $REGISTRY/app:latest
docker tag cloud-cost-compass/rag-service:latest $REGISTRY/rag-service:latest

docker push $REGISTRY/mcp-server:latest
docker push $REGISTRY/app:latest
docker push $REGISTRY/rag-service:latest

echo "Updating image references in manifests..."
for img in mcp-server app rag-service; do
    sed -i "s|cloud-cost-compass/$img:latest|$REGISTRY/$img:latest|g" infra/k8s/*.yaml
done

echo "Deploying..."
kubectl apply -f infra/k8s/ -n $NAMESPACE

echo "Waiting for deployments..."
kubectl rollout status deployment/vault -n $NAMESPACE
kubectl rollout status deployment/keycloak -n $NAMESPACE
kubectl rollout status deployment/mcp-server -n $NAMESPACE
kubectl rollout status deployment/streamlit-app -n $NAMESPACE
kubectl rollout status deployment/rag-service -n $NAMESPACE
kubectl rollout status deployment/qdrant -n $NAMESPACE

echo "=== EKS Deploy Complete ==="