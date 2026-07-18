#!/usr/bin/env bash
set -euo pipefail

IMAGE="testcraft-jenkins-controller"
CONTAINER="testcraft-jenkins-controller"
URL="http://localhost:8090"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
WORKSPACE_ROOT="$HOME/.testcraft-jenkins"

ensure_image() {
  if ! docker image inspect "$IMAGE" >/dev/null 2>&1; then
    docker build -t "$IMAGE" -f "$ROOT/jenkins/controller/Dockerfile" "$ROOT/jenkins/controller"
  fi
}

ensure_workspace_symlinks() {
  mkdir -p "$WORKSPACE_ROOT/workspace"
  for name in api web e2e docs; do
    ln -sfn "$ROOT" "$WORKSPACE_ROOT/workspace/$name"
  done
}

ensure_container() {
  local running
  running=$(docker inspect -f '{{.State.Running}}' "$CONTAINER" 2>/dev/null || echo "false")
  if [ "$running" != "true" ]; then
    docker rm -f "$CONTAINER" >/dev/null 2>&1 || true
    ensure_workspace_symlinks
    echo "Starting $CONTAINER..."
    docker run -d --rm --name "$CONTAINER" \
      --user root \
      --network host \
      -e JENKINS_OPTS="--httpPort=8090" \
      -e JENKINS_HOME="$WORKSPACE_ROOT" \
      -e TESTCRAFT_WORKSPACE_ROOT="$WORKSPACE_ROOT" \
      -e NODE_TLS_REJECT_UNAUTHORIZED=0 \
      -v "$WORKSPACE_ROOT:$WORKSPACE_ROOT" \
      -v "$ROOT:$ROOT" \
      -v /var/run/docker.sock:/var/run/docker.sock \
      --env-file "$ROOT/.secrets" \
      "$IMAGE" >/dev/null
  fi
}

wait_ready() {
  echo "Waiting for Jenkins controller..."
  timeout 120 sh -c "until curl -sf $URL/login >/dev/null 2>&1; do sleep 3; done"
}

wait_job_seeded() {
  local job="$1"
  timeout 60 sh -c "until curl -sf $URL/job/$job/api/json >/dev/null 2>&1; do sleep 2; done"
}

trigger_job() {
  local job="$1"
  echo "Triggering $job..." >&2
  local headers queue_url
  headers=$(curl -s -D - -o /dev/null -X POST "$URL/job/$job/build")
  queue_url=$(printf '%s' "$headers" | { grep -i '^Location:' || true; } | tr -d '\r' | awk '{print $2}')
  if [ -z "$queue_url" ]; then
    echo "Failed to queue build for $job" >&2
    exit 1
  fi

  local build_number=""
  for _ in $(seq 1 60); do
    build_number=$(curl -sf "${queue_url}api/json" | jq -r '.executable.number // empty')
    [ -n "$build_number" ] && break
    sleep 1
  done
  if [ -z "$build_number" ]; then
    echo "Timed out waiting for $job build to leave the queue" >&2
    exit 1
  fi
  printf '%s' "$build_number"
}

stream_log() {
  local job="$1" build="$2" start=0
  while true; do
    local tmp headers body next more
    tmp=$(mktemp)
    headers=$(curl -s -D - -o "$tmp" "$URL/job/$job/$build/logText/progressiveText?start=$start")
    body=$(cat "$tmp")
    rm -f "$tmp"
    printf '%s' "$body"
    next=$(printf '%s' "$headers" | { grep -i '^X-Text-Size:' || true; } | tr -d '\r' | awk '{print $2}')
    more=$(printf '%s' "$headers" | { grep -i '^X-More-Data:' || true; } | tr -d '\r' | awk '{print $2}')
    [ -n "$next" ] && start="$next"
    [ "$more" = "true" ] || break
    sleep 2
  done
}

build_result() {
  local job="$1" build="$2"
  curl -sf "$URL/job/$job/$build/api/json" | jq -r '.result // "UNKNOWN"'
}

main() {
  local job="${1:-}"

  ensure_image
  ensure_container
  wait_ready

  [ -z "$job" ] && exit 0

  wait_job_seeded "$job"
  local build result
  build=$(trigger_job "$job")
  stream_log "$job" "$build"
  result=$(build_result "$job" "$build")
  echo
  echo "== $job build #$build: $result =="
  [ "$result" = "SUCCESS" ]
}

main "$@"
