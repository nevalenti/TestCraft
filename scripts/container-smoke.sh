#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
export SMOKE_TLS_DIR
SMOKE_TLS_DIR=$(mktemp -d /tmp/testcraft-smoke-tls.XXXXXX)
export SMOKE_IMAGE_TAG=${SMOKE_IMAGE_TAG:-smoke-$$}
project="testcraft-smoke-${SMOKE_IMAGE_TAG}"
compose=(docker compose -p "$project" -f compose.smoke.yaml)
cleanup() {
  result=$?
  if (( result != 0 )); then "${compose[@]}" logs --no-color; fi
  "${compose[@]}" down --volumes --remove-orphans
  rm -rf "$SMOKE_TLS_DIR"
  exit "$result"
}
trap cleanup EXIT
openssl req -x509 -newkey rsa:2048 -nodes -days 1 -subj /CN=localhost \
  -keyout "$SMOKE_TLS_DIR/tls.key" -out "$SMOKE_TLS_DIR/tls.crt" > /dev/null 2>&1
chmod 755 "$SMOKE_TLS_DIR"
chmod 644 "$SMOKE_TLS_DIR/tls.key"
"${compose[@]}" build api migrate web gateway
"${compose[@]}" up -d --wait --wait-timeout 120 postgres redis rabbitmq
"${compose[@]}" run --rm migrate
"${compose[@]}" up -d --wait --wait-timeout 180 api web gateway
"${compose[@]}" exec -T api curl --fail --silent http://localhost:8080/api/ready
"${compose[@]}" exec -T gateway curl --fail --silent --insecure https://localhost/api/ready
"${compose[@]}" exec -T gateway sh -c 'curl --fail --silent --insecure https://localhost/projects | grep -q "<div id=\"root\""'
echo 'Container smoke checks passed.'
