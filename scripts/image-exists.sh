#!/usr/bin/env bash

set -euo pipefail

if [ "$#" -ne 2 ]; then
  echo "usage: $(basename "$0") <owner>/<repository> <tag>" >&2
  exit 1
fi

repository=$1
tag=$2

token=$(curl -fsS "https://ghcr.io/token?scope=repository:${repository}:pull" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
if [ -z "$token" ]; then
  echo "could not obtain a registry token for ${repository}" >&2
  exit 1
fi

status=$(curl -sS -o /dev/null -w '%{http_code}' \
  -H "Authorization: Bearer ${token}" \
  -H "Accept: application/vnd.oci.image.index.v1+json,application/vnd.oci.image.manifest.v1+json,application/vnd.docker.distribution.manifest.v2+json,application/vnd.docker.distribution.manifest.list.v2+json" \
  "https://ghcr.io/v2/${repository}/manifests/${tag}")

[ "$status" = "200" ]
