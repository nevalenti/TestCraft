#!/usr/bin/env bash

set -euo pipefail

command -v jq >/dev/null 2>&1 || { echo "::error::jq is required to render infrastructure/keycloak/realm.json" >&2; exit 1; }

BASE_FILE="infrastructure/helm/testcraft/files/realm.json"
OUT_FILE="infrastructure/keycloak/realm.json"

jq '
  (.clients[] | select(.clientId == "testcraft-web") | .redirectUris) += ["http://localhost:4173/*"] |
  (.clients[] | select(.clientId == "testcraft-web") | .webOrigins) += ["http://localhost:4173"] |
  (.clients[] | select(.clientId == "testcraft-api") | .secret) = "testcraft-api-dev-secret" |
  .users = [{
    "username": "e2e@testcraft.pro",
    "email": "e2e@testcraft.pro",
    "emailVerified": true,
    "enabled": true,
    "firstName": "E2E",
    "lastName": "User",
    "credentials": [
      { "type": "password", "value": "e2e-test-password", "temporary": false }
    ]
  }] + .users
' "$BASE_FILE" > "$OUT_FILE"
