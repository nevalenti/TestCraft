---
title: Architecture
description: Repository layout and module boundaries.
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
  e2e/                       # Playwright suite
packages/
  types/                     # Shared TS types, published to web
  ci-reporter/               # CI reporter (npx/Docker) for non-GitHub CI
infrastructure/
  helm/                      # Helm chart
  keycloak/                  # Realm config, login theme
  grafana/                   # Dashboard provisioning
  prometheus/                # Scrape config
.github/
  actions/testcraft/         # CI reporter for GitHub Actions
  workflows/                 # GitHub Actions pipelines
jenkins/                     # Jenkins pipelines
.gitlab-ci.yml               # GitLab CI entry pipeline
.gitlab/ci/                  # GitLab CI includes (API, web, E2E, docs)
```

## Why these boundaries

The API follows Clean Architecture / VSA: `Domain` has no dependencies on
anything else, `Application` depends only on `Domain` and defines interfaces
(`IEmailService`, `INotificationDispatcher`, ...) that `Infrastructure`
implements, and `Api` wires concrete implementations to interfaces at
startup. This keeps request handlers (CQRS commands/queries via MediatR) free
of EF Core, Redis, or MinIO specifics — they depend on `Application`
interfaces, which makes them unit-testable without Testcontainers. Anything
that needs a real Postgres/Redis/MinIO — repository implementations, the
migration runner — lives in `Infrastructure` and is covered by
`TestCraft.Api.IntegrationTests` instead (see
[Running Tests](/docs/guides/testing/)).

The **Gateway** exists so the browser only ever talks to one origin. Without
it, the SPA, API, SignalR hubs, Keycloak, Grafana, and every other service
would each need their own TLS cert and CORS configuration; instead only the
Gateway is exposed, and everything else routes through it by path prefix
(see [Production Deployment](/docs/guides/production/#routing)). This is also
why `CORS_ALLOWED_ORIGINS` is empty by default — same-origin requests through
the Gateway never need it.

Work that shouldn't block a request — JUnit/Allure import parsing, dispatching
notifications when a run's status changes — is handed off via RabbitMQ using
MassTransit: an endpoint publishes a message and returns immediately (e.g.
`202 Accepted` with a job id for imports),
and a consumer in `TestCraft.Application` (`Import/Consumers/*`,
`Notifications/Consumers/RunStatusChangedConsumer`) does the actual work
asynchronously.

The web app mirrors the API's separation: `api/` clients are the only code
that knows about HTTP, `hooks/` wrap them in TanStack Query for caching and
mutation, and `pages/` only call hooks — never `api/` or `fetch` directly.
`stores/` (Zustand) hold client-only UI state that TanStack Query doesn't
own, such as view-mode toggles.

See [Tech Stack](/docs/reference/tech-stack/) for what each layer is built
with, and [Production Deployment](/docs/guides/production/) for how it's all
wired together at runtime.
