---
title: Troubleshooting
description: Common problems when running TestCraft locally or in production.
sidebar:
  order: 5
---

## `make up` never becomes healthy

`docker-compose.yml` wires health checks for Postgres, Redis, RabbitMQ, and
MinIO, and the exporters wait on `service_healthy` before starting. If
`make status` shows a service stuck `starting`, check that container's logs
directly — `docker compose logs -f <service>` — rather than the API, which
will just look stuck waiting on its dependencies.

## API starts but the schema is empty / migration errors

The API only applies EF Core migrations on startup when `APPLY_MIGRATIONS=true`
is set (see [Environment Variables](/docs/reference/environment-variables/)).
With it unset or `false`, a fresh database has no tables and every request
fails. Migrations retry against Postgres up to 5 times with a 5s delay and a
10-minute overall timeout, then give up — if you see repeated
`Database not ready (attempt N/5)` warnings in the API logs, Postgres itself
isn't accepting connections yet (check its health check / `POSTGRES_*` vars
match between the API and the database container).

## Can't sign in / "invalid_client" or redirect loops from Keycloak

Keycloak imports the `testcraft` realm from `infrastructure/keycloak/realm.json`
on first start only — `start-dev --import-realm` skips re-importing once the
realm already exists in its volume. If you edited `realm.json` after the
first `make up`, either delete the Keycloak volume or re-import manually;
editing the file alone has no effect on an already-running stack.

Social login (GitHub/Google) buttons only appear if `GITHUB_CLIENT_ID` /
`GOOGLE_CLIENT_ID` are set _before_ the realm import — the import script
templates the identity provider config from those env vars at container
start.

## GitHub Action / CI reporter can't reach the API

The `keycloak-authority` input (or `KEYCLOAK_AUTHORITY` env var) is fetched
from `api-url/api/auth-config` when not supplied explicitly. If your CI
runner can reach `api-url` but not the Keycloak host that endpoint returns
(common when Keycloak is only reachable via an internal hostname), pass
`keycloak-authority` explicitly to skip that lookup. See
[CI Integration](/docs/guides/ci-integration/#authentication).

## Webhooks aren't firing, or the signature doesn't verify

- Webhooks only fire for events the subscription's checkboxes include
  (`RunCompleted`, `FailureThresholdExceeded`) and only while the
  subscription is active — see
  [Settings & Access](/docs/using-testcraft/settings-and-access/#notifications).
- Delivery failures (non-2xx response, timeout, DNS error) are logged
  server-side and **not retried** — there's no dead-letter queue or backoff,
  so an endpoint that's down when the event fires simply misses it.
- If you set a secret, verify the `X-Signature: sha256=<hex>` header as
  `HMAC-SHA256(secret, raw_json_body)`, lowercase hex — not the JWT-style
  base64url some webhook frameworks default to.

## Swagger UI returns 401 in production

`/api/docs` is gated behind HTTP Basic Auth once
`SWAGGER_BASIC_AUTH_USERNAME` / `SWAGGER_BASIC_AUTH_PASSWORD` (or their Helm
equivalents) are set — this is separate from the Keycloak bearer token used
by the API itself. Local dev has no Basic Auth because those variables are
unset by default in `.env.example`.

## CORS errors calling the API from a browser

`CORS_ALLOWED_ORIGINS` is empty by default, which means **no** cross-origin
requests are allowed — the web app talking to the API on the same origin
(via the Gateway) never hits this, but a separately-hosted frontend or a
local Vite dev server on a different port needs its origin added explicitly
as a comma-separated list.

## `make e2e-*` fails but a plain `dotnet test`/`pnpm test` run doesn't

The E2E targets reproduce the exact CI pipeline (via `act`,
`gitlab-ci-local`, or a throwaway Jenkins controller — see
[Running Tests](/docs/guides/testing/#reproducing-ci-locally)), which runs
against the full stack including Keycloak and Postgres from a cold start.
Flakiness here usually means a service wasn't healthy yet when tests began —
check the emulator's own log output first, since `act`/`gitlab-ci-local`
often swallow container startup errors from the job's perspective.

## Helm deploy succeeds but a route 404s / 502s

Check that the new or changed route's `PathRemovePrefix` transform matches
the downstream app's own base-path configuration — see
[Production Deployment](/docs/guides/production/#routing). A mismatch here
(Gateway strips `/foo` but the app still expects requests at `/foo/*`)
produces 404s from the app even though the Gateway itself is routing
correctly.
