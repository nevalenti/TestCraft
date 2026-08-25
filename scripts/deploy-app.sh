#!/usr/bin/env bash

set -euo pipefail

if [ "$#" -ne 3 ]; then
  echo "usage: $(basename "$0") <app> <tag> <ghcr-owner>" >&2
  exit 1
fi

app=$1
tag=$2
ghcr_owner=$3

helm() { sudo helm --kubeconfig /etc/rancher/k3s/k3s.yaml "$@"; }

require_image() {
  scripts/image-exists.sh "${ghcr_owner}/testcraft-$1" "$tag" || {
    echo "ghcr.io/${ghcr_owner}/testcraft-$1:${tag} does not exist - refusing to deploy" >&2
    exit 1
  }
}

require_image "$app"

extra_args=()
if [ "$app" = "api" ]; then
  require_image migrator
  extra_args+=(--set images.migrator.tag="$tag" --set images.migrator.pullPolicy=IfNotPresent)
fi

helm upgrade --install testcraft infrastructure/helm/testcraft \
  --namespace testcraft \
  --values infrastructure/helm/testcraft/values.production.yaml \
  --values infrastructure/helm/testcraft/values.secrets.yaml \
  --reset-then-reuse-values --server-side=true --force-conflicts \
  --set images."$app".tag="$tag" \
  --set images."$app".pullPolicy=IfNotPresent \
  "${extra_args[@]}"

scripts/rollout.sh "deployment/$app"
