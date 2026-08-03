---
title: Architecture
description: Repository layout, module boundaries, and tech stack.
sidebar:
  order: 1
---

```
apps/
  Api/src/
    TestCraft.Domain         # Entities, domain events
    TestCraft.Application    # CQRS (MediatR)
    TestCraft.Infrastructure # EF Core, Redis, MinIO, MailKit, MassTransit
    TestCraft.Api            # Controllers, SignalR hubs
  Gateway/src/               # YARP reverse proxy (Web + API)
  docs/                      # This site (Astro Starlight)
  web/                       # React SPA
    src/api/                 # Axios clients, one per domain
    src/hooks/                # TanStack Query hooks, one per domain
    src/stores/               # Zustand stores
    src/pages/                # Route components (hooks only)
    src/layout/               # App shell
    src/components/           # Shared components, ui/ primitives
    src/auth/                 # Keycloak provider
    src/contexts/             # React contexts (theme)
    src/lib/                  # Shared helpers
    src/types/                # Shared frontend types
    src/__tests__/            # Vitest tests
packages/
  types/                     # Shared TS types, published to web
  ci-reporter/               # CI reporter (npx/Docker) for non-GitHub CI
e2e/                         # Playwright suite — its own workspace package,
                              # not a deployed app like the ones under apps/
Common/src/                  # TestCraft.Common — shared cross-cutting .NET
                              # code (e.g. security helpers), referenced by
                              # both apps/Api and apps/Gateway
infrastructure/
  helm/                      # Helm chart
  keycloak/                  # Realm config, login theme
  prometheus/                # Local docker-compose scrape/alertmanager config
.github/
  actions/testcraft/         # CI reporter for GitHub Actions
  workflows/                 # GitHub Actions pipelines
jenkins/                     # Jenkins pipelines
.gitlab-ci.yml               # GitLab CI entry pipeline
.gitlab/ci/                  # GitLab CI includes (API, web, E2E, docs)
```

## Tech stack

| Layer          | Technology                                                   |
| -------------- | ------------------------------------------------------------ |
| Frontend       | React 19, TanStack Query/Router/Table, Zustand, Tailwind CSS |
| Backend        | ASP.NET Core (.NET 10), CQRS via MediatR                     |
| Database       | PostgreSQL, EF Core                                          |
| Cache          | Redis                                                        |
| Messaging      | MassTransit + RabbitMQ                                       |
| Real-time      | SignalR                                                      |
| Object storage | MinIO                                                        |
| Email          | MailKit (SMTP)                                               |
| Auth           | Keycloak (SSO, GitHub/Google social login)                   |
| Reverse proxy  | YARP                                                         |
| Observability  | Grafana · Prometheus · Loki · Seq                            |
| E2E testing    | Playwright                                                   |
| Deployment     | Docker, Helm on k3s                                          |
| Docs           | Astro + Starlight (this site)                                |

**Monorepo tooling** — pnpm workspaces + Turborepo; TypeScript across web,
e2e, ci-reporter, and docs; xUnit + Testcontainers for .NET; Vitest for
TypeScript.

See [Production Deployment](/docs/guides/production/) for how it's all wired
together at runtime.
