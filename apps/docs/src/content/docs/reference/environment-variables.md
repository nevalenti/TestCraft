---
title: Environment Variables
description: Configuration reference for the API, web app, and Docker Compose stack.
sidebar:
  order: 3
---

`.env.example` at the repo root covers the full local stack (`make up`).
Copy it to `.env` and fill in real values before starting.

## Database

| Variable            | Default        | Notes                                                 |
| ------------------- | -------------- | ----------------------------------------------------- |
| `POSTGRES_USER`     | `testcraft`    |                                                       |
| `POSTGRES_PASSWORD` | `changeme`     |                                                       |
| `POSTGRES_DB`       | `testcraft_db` |                                                       |
| `DATABASE_URL`      | —              | Full connection string used by the API                |
| `APPLY_MIGRATIONS`  | `false`        | API applies EF Core migrations on startup when `true` |

In production, the API, Keycloak, and the Prometheus postgres-exporter each connect as their
own dedicated Postgres role (`testcraft_app`, `testcraft_keycloak`, `testcraft_monitor`) instead
of the superuser — the exporter's role only has the built-in read-only `pg_monitor` grant. See
`infrastructure/helm/testcraft/files/init.sql`. The local Docker Compose stack keeps a single
shared `POSTGRES_USER` for simplicity since local Keycloak uses its own embedded dev database,
not this Postgres instance.

## Messaging

| Variable       | Default                                    |
| -------------- | ------------------------------------------ |
| `RABBITMQ_URL` | `amqp://testcraft:changeme@localhost:5672` |

## Caching (Redis)

| Variable    | Default | Notes                                                                                                                           |
| ----------- | ------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `REDIS_URL` | —       | Optional. When unset, the API falls back to a no-op cache (`NoOpCacheService`); set it to enable distributed caching via Redis. |

In production, Redis requires a password (`--requirepass`, set via the `redisPassword` Helm secret) and
`REDIS_URL` includes it (`redis://:<password>@redis:6379`). The local Docker Compose stack runs Redis
without a password since it isn't reachable outside your machine.

## Auth (Keycloak)

| Variable                                    | Default                                  |
| ------------------------------------------- | ---------------------------------------- |
| `KEYCLOAK_ADMIN`                            | `admin`                                  |
| `KEYCLOAK_ADMIN_PASSWORD`                   | `changeme`                               |
| `KEYCLOAK_ADMIN_CLIENT_ID`                  | `testcraft-api`                          |
| `KEYCLOAK_ADMIN_CLIENT_SECRET`              | —                                        |
| `KEYCLOAK_AUTHORITY`                        | `http://localhost:8080/realms/testcraft` |
| `KEYCLOAK_AUDIENCE`                         | `testcraft-web`                          |
| `KEYCLOAK_REQUIRE_HTTPS_METADATA`           | `false`                                  |
| `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` | —                                        |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | —                                        |

`KEYCLOAK_ADMIN` / `KEYCLOAK_ADMIN_PASSWORD` bootstrap the Keycloak server's own master-realm
admin account (used only by the Keycloak container itself). The API authenticates to Keycloak's
admin REST API separately, as the `testcraft-api` service-account client via
`KEYCLOAK_ADMIN_CLIENT_ID` / `KEYCLOAK_ADMIN_CLIENT_SECRET`, scoped to the `view-users` role on
the `testcraft` realm only — not full master-realm admin.

GitHub/Google credentials enable social login on the `testcraft` Keycloak
realm — see `infrastructure/keycloak/realm.json`.

## Storage (MinIO)

| Variable                | Default                 |
| ----------------------- | ----------------------- |
| `MINIO_ROOT_USER`       | `minioadmin`            |
| `MINIO_ROOT_PASSWORD`   | `minioadmin`            |
| `MINIO_ENDPOINT`        | `localhost:9000`        |
| `MINIO_PUBLIC_ENDPOINT` | `localhost:9000`        |
| `MINIO_ACCESS_KEY`      | `minioadmin`            |
| `MINIO_SECRET_KEY`      | `minioadmin`            |
| `MINIO_BUCKET`          | `testcraft-attachments` |
| `MINIO_USE_SSL`         | `false`                 |

## Email (SMTP)

| Variable                      | Default                      |
| ----------------------------- | ---------------------------- |
| `SMTP_HOST`                   | `localhost` (Mailpit in dev) |
| `SMTP_PORT`                   | `1025`                       |
| `SMTP_USER` / `SMTP_PASSWORD` | —                            |
| `SMTP_FROM_ADDRESS`           | `noreply@testcraft.pro`      |

## Observability & misc

| Variable                                                        | Default                 | Notes                                                     |
| --------------------------------------------------------------- | ----------------------- | --------------------------------------------------------- |
| `SEQ_URL` (also Gateway)                                        | `http://localhost:5341` | Structured log sink — leave empty to disable (as CI does) |
| `LOKI_URL` (also Gateway)                                       | —                       | Structured log sink — leave empty to disable              |
| `SEQ_API_KEY` (also Gateway)                                    | —                       | Optional API key for the Seq sink above                   |
| `GRAFANA_ADMIN_PASSWORD`                                        | `changeme`              |                                                           |
| `CORS_ALLOWED_ORIGINS`                                          | —                       | Comma-separated origins allowed to call the API           |
| `METRICS_TOKEN`                                                 | —                       | Bearer token required on `/api/metrics` when set          |
| `SWAGGER_BASIC_AUTH_USERNAME` / `SWAGGER_BASIC_AUTH_PASSWORD`   | —                       | Gate `/api/docs` in non-dev environments                  |
| `SEQ_BASIC_AUTH_USERNAME` / `SEQ_BASIC_AUTH_PASSWORD` (Gateway) | —                       | Gate `/seq` at the gateway, in front of Seq's own login   |

The gateway is the only publicly reachable service besides the API/web/docs, so anything it proxies
needs its own auth. Seq (`/seq`) is gated twice: the `testcraft-api` Gateway requires this Basic Auth
before proxying the request, and Seq itself is provisioned with an admin account via
`SEQ_FIRSTRUN_ADMINUSERNAME`/`SEQ_FIRSTRUN_ADMINPASSWORD` (same password, `seqAdminPassword` in Helm
secrets). Grafana (`/grafana`) only needs its own login (`GF_SECURITY_ADMIN_PASSWORD`), since Grafana
enforces authentication itself.

The Gateway ships structured logs to the same Loki/Seq sinks as the API (`LOKI_URL`/`SEQ_URL`/`SEQ_API_KEY`),
including a request-level access log, and generates/forwards an `x-request-id` header so a request can be
traced from the Gateway through to the API in the same log query.

## Production secrets

In production these map to `infrastructure/helm/testcraft/values.secrets.yaml`
(gitignored — copy from `values.secrets.yaml.example`) rather than a `.env`
file. See [Production Deployment](/docs/guides/production/).
