#!/usr/bin/env bash

set -euo pipefail
cd "$(dirname "$0")/.."

keys() { grep -oE '^[A-Za-z_][A-Za-z0-9_]*=' "$1" | tr -d = | sort -u; }

for dir in . apps/web e2e; do
  example="$dir/.env.example"
  env_file="$dir/.env"
  [[ -f "$example" ]] || continue

  if [[ ! -f "$env_file" ]]; then
    cp "$example" "$env_file"
    echo "created $env_file from $example"
    continue
  fi

  missing=$(comm -13 <(keys "$env_file") <(keys "$example"))
  if [[ -n "$missing" ]]; then
    [[ -z "$(tail -c1 "$env_file")" ]] || echo >> "$env_file"
    for key in $missing; do
      grep -E "^${key}=" "$example" >> "$env_file"
      echo "added $key to $env_file"
    done
  fi

  for key in $(comm -23 <(keys "$env_file") <(keys "$example")); do
    echo "$env_file has $key, which $example does not define" >&2
  done
done
