#!/usr/bin/env bash

set -euo pipefail

kubectl() { sudo k3s kubectl "$@"; }

kubectl create namespace testcraft --dry-run=client -o yaml | kubectl apply -f -
kubectl label namespace testcraft app.kubernetes.io/managed-by=Helm --overwrite
kubectl annotate namespace testcraft meta.helm.sh/release-name=testcraft meta.helm.sh/release-namespace=testcraft --overwrite

if kubectl get secret testcraft-tls -n testcraft >/dev/null 2>&1; then
  exit 0
fi

tmpdir=$(mktemp -d)
trap 'rm -rf "$tmpdir"' EXIT

openssl req -x509 -newkey rsa:2048 -nodes -days 1 \
  -keyout "$tmpdir/tls.key" -out "$tmpdir/tls.crt" -subj "/CN=bootstrap"

kubectl create secret tls testcraft-tls -n testcraft --cert="$tmpdir/tls.crt" --key="$tmpdir/tls.key"
