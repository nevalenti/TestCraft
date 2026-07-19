#!/usr/bin/env bash

set -euo pipefail

if [ "$#" -eq 0 ]; then
  echo "usage: $(basename "$0") <deployment> [deployment...]" >&2
  exit 1
fi

kubectl() { sudo k3s kubectl "$@"; }
helm() { sudo helm --kubeconfig /etc/rancher/k3s/k3s.yaml "$@"; }

kubectl rollout restart "$@" -n testcraft

if ! kubectl rollout status "$@" -n testcraft --timeout=120s; then
  echo "rollout of $* failed, rolling back release" >&2
  helm rollback testcraft -n testcraft
  exit 1
fi
