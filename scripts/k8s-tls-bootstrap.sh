#!/usr/bin/env bash

set -euo pipefail

kubectl() { sudo k3s kubectl "$@"; }

if kubectl get secret testcraft-tls -n testcraft >/dev/null 2>&1; then
  exit 0
fi

tmpdir=$(mktemp -d)
trap 'rm -rf "$tmpdir"' EXIT

openssl req -x509 -newkey rsa:2048 -nodes -days 1 \
  -keyout "$tmpdir/tls.key" -out "$tmpdir/tls.crt" -subj "/CN=bootstrap"

kubectl create secret tls testcraft-tls -n testcraft --cert="$tmpdir/tls.crt" --key="$tmpdir/tls.key"
