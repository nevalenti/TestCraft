---
title: API Reference
description: Where to find the interactive Swagger UI and OpenAPI spec.
sidebar:
  order: 4
---

The API is fully documented via OpenAPI/Swagger — generated from XML doc
comments and Swashbuckle annotations, so it's always in sync with the code.

## Swagger UI

Interactive docs are mounted at `/api/docs`:

- Local dev: `http://localhost:5000/api/docs`
- Production: `https://<your-domain>/api/docs` (proxied through the Gateway's
  `/api/*` route)

In production, Swagger UI is gated behind HTTP Basic Auth — set
`SWAGGER_BASIC_AUTH_USERNAME` / `SWAGGER_BASIC_AUTH_PASSWORD` (or the Helm
equivalents) to enable it.

## OpenAPI spec

A static copy of the v1 spec is checked into the repo at
`apps/Api/openapi/v1.json`. `@testcraft/types` runs it through
[`openapi-typescript`](https://openapi-ts.dev) to generate request/response
types, which the web app's hand-written Axios clients
(`apps/web/src/api/`) consume.

## Authentication

All endpoints (other than health/auth-config) require a Keycloak-issued JWT
bearer token — see the `bearerAuth` security scheme in Swagger UI to
authenticate requests directly from the docs. For CI/machine-to-machine
access, see [CI Integration](/docs/guides/ci-integration/).

## Resource shape

Everything under `/api/v1` nests below `/projects/{projectId}`, matching the
"everything lives inside a project" model:

| Resource                                  | Path prefix                                                                                                                       |
| ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Projects                                  | `/api/v1/projects`                                                                                                                |
| Test suites                               | `/api/v1/projects/{projectId}/suites`                                                                                             |
| Test cases / steps (within a suite)       | `/api/v1/projects/{projectId}/suites/{suiteId}/cases`                                                                             |
| Test cases (project-wide, e.g. labeling)  | `/api/v1/projects/{projectId}/cases`                                                                                              |
| Labels                                    | `/api/v1/projects/{projectId}/labels`                                                                                             |
| Test plans                                | `/api/v1/projects/{projectId}/plans`                                                                                              |
| Test runs / results / attachments         | `/api/v1/projects/{projectId}/runs`                                                                                               |
| JUnit / Allure import                     | `POST /api/v1/projects/{projectId}/import/{junit,allure}` to queue, `GET /api/v1/projects/{projectId}/import/{id}` to poll status |
| Analytics (trend, flaky, breakdown, diff) | `/api/v1/projects/{projectId}/analytics`                                                                                          |
| Notifications (webhooks, emails)          | `/api/v1/projects/{projectId}/notifications`                                                                                      |
| Members                                   | `/api/v1/projects/{projectId}/members`                                                                                            |
| API tokens                                | `/api/v1/projects/{projectId}/tokens`                                                                                             |
| Public share links                        | `/api/v1/projects/{projectId}/runs/{runId}/share` to create, `/api/v1/share/{token}` to read                                      |

## Operational endpoints

A handful of unversioned, unauthenticated-or-differently-authenticated
endpoints sit outside `/api/v1`, intended for infrastructure rather than
the web app:

| Path               | Purpose                                                                                                    |
| ------------------ | ---------------------------------------------------------------------------------------------------------- |
| `/api/ready`       | Liveness — returns `ok` once the process has started, no dependency checks                                 |
| `/api/health`      | Readiness — pings the database, returns 503 if it's unreachable                                            |
| `/api/status`      | Version/build info                                                                                         |
| `/api/metrics`     | Prometheus scrape endpoint — bearer-token gated by `METRICS_TOKEN` when set                                |
| `/api/auth-config` | Public Keycloak authority/realm info, used by the web app and CI tooling to discover where to authenticate |

See [Environment Variables](/docs/reference/environment-variables/) for
`METRICS_TOKEN` and the Swagger Basic Auth variables.
