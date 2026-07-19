#!/usr/bin/env bash

set -euo pipefail

kubectl() { sudo k3s kubectl "$@"; }

kubectl create namespace testcraft --dry-run=client -o yaml | kubectl apply -f -
kubectl label namespace testcraft app.kubernetes.io/managed-by=Helm --overwrite
kubectl annotate namespace testcraft meta.helm.sh/release-name=testcraft meta.helm.sh/release-namespace=testcraft --overwrite
