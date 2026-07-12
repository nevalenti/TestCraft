---
title: Environment Variables
description: Configuration reference for the API, web app, and Docker Compose stack.
sidebar:
  order: 3
---

`.env.example` at the repo root covers the full local stack (`make up`).
Copy it to `.env` and fill in real values before starting.

## Database

| Variable                | Default        | Notes                                                 |
| ----------------------- | -------------- | ----------------------------------------------------- |
| `POSTGRES_USER`         | `testcraft`    |                                                       |
| `POSTGRES_PASSWORD`     | `changeme`     |                                                       |
| `POSTGRES_DB`           | `testcraft_db` |                                                       |
| `DATABASE_URL`          | —              | Full connection string used by the API                |
| `POSTGRES_EXPORTER_DSN` | —              | Used by the Prometheus postgres-exporter              |
| `APPLY_MIGRATIONS`      | `false`        | API applies EF Core migrations on startup when `true` |

## Messaging

| Variable       | Default                                    |
| -------------- | ------------------------------------------ |
| `RABBITMQ_URL` | `amqp://testcraft:changeme@localhost:5672` |

## Caching (Redis)

| Variable    | Default | Notes                                                                                                                           |
| ----------- | ------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `REDIS_URL` | —       | Optional. When unset, the API falls back to a no-op cache (`NoOpCacheService`); set it to enable distributed caching via Redis. |

## Auth (Keycloak)

| Variable                                    | Default                                  |
| ------------------------------------------- | ---------------------------------------- |
| `KEYCLOAK_ADMIN`                            | `admin`                                  |
| `KEYCLOAK_ADMIN_PASSWORD`                   | `changeme`                               |
| `KEYCLOAK_AUTHORITY`                        | `http://localhost:8080/realms/testcraft` |
| `KEYCLOAK_AUDIENCE`                         | `testcraft-web`                          |
| `KEYCLOAK_REQUIRE_HTTPS_METADATA`           | `false`                                  |
| `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` | —                                        |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | —                                        |

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
| `SMTP_FROM_ADDRESS`           | `noreply@testcraft.dev`      |

## Observability & misc

| Variable                                                      | Default                 | Notes                                                     |
| ------------------------------------------------------------- | ----------------------- | --------------------------------------------------------- |
| `SEQ_URL`                                                     | `http://localhost:5341` | Structured log sink — leave empty to disable (as CI does) |
| `GRAFANA_ADMIN_PASSWORD`                                      | `changeme`              |                                                           |
| `CORS_ALLOWED_ORIGINS`                                        | —                       | Comma-separated origins allowed to call the API           |
| `METRICS_TOKEN`                                               | —                       | Bearer token required on `/api/metrics` when set          |
| `SWAGGER_BASIC_AUTH_USERNAME` / `SWAGGER_BASIC_AUTH_PASSWORD` | —                       | Gate `/api/docs` in non-dev environments                  |

## Production secrets

In production these map to `infrastructure/helm/testcraft/values.secrets.yaml`
(gitignored — copy from `values.secrets.yaml.example`) rather than a `.env`
file. See [Production Deployment](/docs/guides/production/).
