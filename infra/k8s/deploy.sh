#!/usr/bin/env bash
set -euo pipefail

DEPLOY_DIR=${DEPLOY_DIR:-/home/nevalenti/testcraft}
NAMESPACE=${NAMESPACE:-testcraft}

echo "==> Applying namespace"
kubectl apply -f "$DEPLOY_DIR/infra/k8s/namespace.yaml"

echo "==> Creating secret from .env"
kubectl create secret generic testcraft-secrets \
  --from-env-file="$DEPLOY_DIR/.env" \
  --namespace="$NAMESPACE" \
  --dry-run=client -o yaml | kubectl apply -f -

echo "==> Applying ConfigMaps"

kubectl create configmap prometheus-config \
  --from-file=prometheus.yml="$DEPLOY_DIR/infra/prometheus/prometheus.k8s.yml" \
  --namespace="$NAMESPACE" \
  --dry-run=client -o yaml | kubectl apply -f -

kubectl create configmap tempo-config \
  --from-file=tempo.yaml="$DEPLOY_DIR/infra/tempo/tempo.yaml" \
  --namespace="$NAMESPACE" \
  --dry-run=client -o yaml | kubectl apply -f -

kubectl create configmap grafana-provisioning-datasources \
  --from-file="$DEPLOY_DIR/infra/grafana/provisioning/datasources/" \
  --namespace="$NAMESPACE" \
  --dry-run=client -o yaml | kubectl apply -f -

kubectl create configmap grafana-provisioning-dashboards \
  --from-file="$DEPLOY_DIR/infra/grafana/provisioning/dashboards/" \
  --namespace="$NAMESPACE" \
  --dry-run=client -o yaml | kubectl apply -f -

kubectl create configmap keycloak-realm \
  --from-file=testcraft-realm.json="$DEPLOY_DIR/infra/keycloak/testcraft-realm.json" \
  --namespace="$NAMESPACE" \
  --dry-run=client -o yaml | kubectl apply -f -

kubectl create configmap nginx-gateway-config \
  --from-file=nginx.conf="$DEPLOY_DIR/infra/nginx/production.conf" \
  --namespace="$NAMESPACE" \
  --dry-run=client -o yaml | kubectl apply -f -

echo "==> Applying manifests"
kubectl apply -f "$DEPLOY_DIR/infra/k8s/"

echo "==> Done — check status with: kubectl get pods -n $NAMESPACE"
