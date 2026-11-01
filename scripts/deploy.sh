#!/usr/bin/env bash

set -euo pipefail

usage() {
  echo "usage: APPS=\"<app>...\" $(basename "$0")" >&2
  echo "       $(basename "$0") <app> <tag> <ghcr-owner>" >&2
  exit 1
}

kubectl() { sudo k3s kubectl "$@"; }
k3s_helm() { sudo helm --kubeconfig /etc/rancher/k3s/k3s.yaml "$@"; }

upgrade() {
  k3s_helm upgrade --install testcraft infrastructure/helm/testcraft \
    --namespace testcraft \
    --values infrastructure/helm/testcraft/values.production.yaml \
    --values infrastructure/helm/testcraft/values.secrets.yaml \
    --reset-then-reuse-values --server-side=true --force-conflicts \
    "$@"
}

rollout() {
  kubectl rollout restart "$@" -n testcraft
  if ! kubectl rollout status "$@" -n testcraft --timeout=120s; then
    echo "rollout of $* failed, rolling back release" >&2
    k3s_helm rollback testcraft -n testcraft
    exit 1
  fi
}

image_exists() {
  local repository=$1 tag=$2 token status
  token=$(curl -fsS "https://ghcr.io/token?scope=repository:${repository}:pull" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
  if [ -z "$token" ]; then
    echo "could not obtain a registry token for ${repository}" >&2
    return 1
  fi
  status=$(curl -sS -o /dev/null -w '%{http_code}' \
    -H "Authorization: Bearer ${token}" \
    -H "Accept: application/vnd.oci.image.index.v1+json,application/vnd.oci.image.manifest.v1+json,application/vnd.docker.distribution.manifest.v2+json,application/vnd.docker.distribution.manifest.list.v2+json" \
    "https://ghcr.io/v2/${repository}/manifests/${tag}")
  [ "$status" = "200" ]
}

deploy_all() {
  [ -n "${APPS:-}" ] || usage
  local deployments=()
  for app in $APPS; do deployments+=("deployment/$app"); done
  upgrade
  rollout "${deployments[@]}"
}

deploy_app() {
  local app=$1 tag=$2 ghcr_owner=$3
  if ! image_exists "${ghcr_owner}/testcraft-${app}" "$tag"; then
    echo "ghcr.io/${ghcr_owner}/testcraft-${app}:${tag} does not exist - refusing to deploy" >&2
    exit 1
  fi
  local extra=()
  if [ "$app" = "api" ]; then
    if ! image_exists "${ghcr_owner}/testcraft-migrator" "$tag"; then
      echo "ghcr.io/${ghcr_owner}/testcraft-migrator:${tag} does not exist - refusing to deploy" >&2
      exit 1
    fi
    extra+=(--set images.migrator.tag="$tag" --set images.migrator.pullPolicy=IfNotPresent)
  fi
  upgrade --set images."$app".tag="$tag" --set images."$app".pullPolicy=IfNotPresent "${extra[@]}"
  rollout "deployment/$app"
}

case $# in
  0) deploy_all ;;
  3) deploy_app "$@" ;;
  *) usage ;;
esac
