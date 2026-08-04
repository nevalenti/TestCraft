---
title: Troubleshooting
description: Common problems when running TestCraft locally or in production.
sidebar:
  order: 6
---

## `just up` never becomes healthy

Check the stuck service's own logs (`docker compose logs -f <service>`)
rather than the API, which just waits on its dependencies.

## API starts but the schema is empty / migration errors

`APPLY_MIGRATIONS` isn't `true` (see [Environment Variables](/docs/reference/environment-variables/)).
Migrations retry against Postgres up to 5 times over 10 minutes, then give
up — repeated `Database not ready (attempt N/5)` warnings mean Postgres
itself isn't accepting connections yet.

## Can't sign in / "invalid_client" or redirect loops from Keycloak

Keycloak only imports `realm.json` on first start. If you edited it after
the first `just up`, delete the Keycloak volume or re-import manually.

Social login buttons need `GITHUB_CLIENT_ID`/`GOOGLE_CLIENT_ID` set _before_
the realm import.

## GitHub Action / CI reporter can't reach the API

`keycloak-authority` is fetched from `api-url/api/auth-config` when not set.
If your runner can reach `api-url` but not the Keycloak host that returns
(common with an internal-only Keycloak hostname), pass `keycloak-authority`
explicitly. See [CI Integration](/docs/guides/ci-integration/#authentication).

## Webhooks aren't firing, or the signature doesn't verify

- Only `run.completed` fires, and only while the subscription is active.
- Delivery failures aren't retried — no dead-letter queue or backoff.
- Verify `X-Signature: sha256=<hex>` as `HMAC-SHA256(secret, raw_json_body)`,
  lowercase hex.

## Swagger UI returns 401 in production

Expected once `SWAGGER_BASIC_AUTH_USERNAME`/`PASSWORD` are set — separate
from the Keycloak bearer token used by the API itself.

## CORS errors calling the API from a browser

`CORS_ALLOWED_ORIGINS` is empty by default — add your frontend's origin as a
comma-separated list. The web app talking to the API through the Gateway
never hits this (same origin); a separately-hosted frontend or local dev
server does.

## `just github e2e` (or `gitlab`/`jenkins`) fails but a plain test run doesn't

These run against the full stack from a cold start — flakiness usually means
a service wasn't healthy yet. Check the emulator's own log output first
(`act`/`gitlab-ci-local` often swallow container startup errors).

## Helm deploy succeeds but a route 404s / 502s

Check the route's `PathRemovePrefix` transform matches the downstream app's
base-path config — see [Production Deployment](/docs/guides/production/#routing).
