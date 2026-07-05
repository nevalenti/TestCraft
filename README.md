# TestCraft

[![API](https://github.com/nevalenti/TestCraft/actions/workflows/api.yml/badge.svg)](https://github.com/nevalenti/TestCraft/actions/workflows/api.yml)
[![Web](https://github.com/nevalenti/TestCraft/actions/workflows/web.yml/badge.svg)](https://github.com/nevalenti/TestCraft/actions/workflows/web.yml)
[![E2E](https://github.com/nevalenti/TestCraft/actions/workflows/e2e.yml/badge.svg)](https://github.com/nevalenti/TestCraft/actions/workflows/e2e.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

> A self-hosted alternative to TestRail/Xray: organise projects, suites, and test cases, import JUnit/Allure reports, track runs in real time, and get notified via email or webhooks.

## Built With

| Layer          | Technology                        |
| -------------- | --------------------------------- |
| Frontend       | React 19                          |
| Backend        | ASP.NET Core (.NET 10)            |
| Database       | PostgreSQL                        |
| Cache          | Redis                             |
| Messaging      | MassTransit + RabbitMQ            |
| Real-time      | SignalR                           |
| Object storage | MinIO                             |
| Auth           | Keycloak                          |
| Reverse proxy  | YARP                              |
| Observability  | Grafana · Prometheus · Loki · Seq |
| Deployment     | Helm on k3s                       |

---

## Features

### Test management

- **Projects & suites** — projects → suites → test cases; test case steps support drag-and-drop reordering
- **Test plans** — curate ordered lists of test cases across suites with drag-and-drop reordering
- **JUnit / Allure import** — upload reports and have results mapped automatically to existing test cases
- **Attachments** — file uploads stored in MinIO, scoped to test results
- **Analytics** — trend charts, flaky test detection, suite breakdown, and run comparison per project

### Test runs

- **Live progress** — track runs in real time via SignalR, with a live log feed per pipeline run
- **Shareable links** — read-only run views via public share tokens
- **Notifications** — email (SMTP) and outbound webhooks on run completion

### CI integration

- **GitHub Action** — first-party action reports JUnit results, starts active runs, and uploads Playwright screenshots straight from CI
- **CI reporter CLI** — `@testcraft/ci-reporter`, an npx/Docker equivalent of the GitHub Action for GitLab CI and other CI systems
- **API tokens** — machine-to-machine access for CI pipelines

### Accounts & access

- **Keycloak auth** — SSO with optional GitHub social login
- **Project members** — invite collaborators to projects for shared access
- **Accounts** — profile settings with avatar upload

### Observability

- Prometheus metrics and Grafana dashboards ship out of the box, alongside Loki/Seq log aggregation

---

## Architecture

```
apps/
  Api/src/
    TestCraft.Domain           # entities, domain events
    TestCraft.Application      # CQRS commands/queries (MediatR), interfaces
    TestCraft.Infrastructure   # EF Core, Redis, MinIO, MailKit, MassTransit
    TestCraft.Api              # ASP.NET Core controllers, SignalR hubs
  Gateway/src/                 # YARP reverse proxy — fronts Web + API in production
  web/                         # React SPA
    src/api/                   # Axios clients — one file per domain
    src/hooks/                 # TanStack Query hooks — one file per domain
    src/stores/                # Zustand stores (breadcrumbs, notifications, view mode)
    src/pages/                 # Route components consuming hooks only
    src/layout/                # App shell — header, sidebar, account menu, breadcrumbs
    src/components/            # Shared components + ui/ primitives
    src/auth/                  # Keycloak provider/client
    src/contexts/              # React context providers (theme)
    src/lib/                   # cn, env, format, cookie, notify helpers
    src/types/                 # Shared frontend types
    src/__tests__/             # Vitest unit/component tests
  e2e/                         # Playwright end-to-end suite
packages/
  types/                       # Shared TypeScript types (published to web)
  ci-reporter/                 # CI results reporter (npx / Docker) for GitLab CI and other non-GitHub CI systems
infrastructure/
  helm/                        # Helm chart for k8s deployment
  keycloak/                    # Realm config + custom login theme
  grafana/                     # Dashboard provisioning
  prometheus/                  # Scrape config
.github/actions/testcraft/     # GitHub Action that reports CI results into TestCraft
```

---

## Getting Started

**Prerequisites:** Docker, .NET 10 SDK, Node.js 22+, pnpm

```bash
git clone https://github.com/nevalenti/TestCraft.git
cd TestCraft
pnpm install
cp .env.example .env
make up
```

Keycloak imports the `testcraft` realm automatically on first start. The API applies migrations on startup when `APPLY_MIGRATIONS=true` (set in `.env.example`).

Then in separate terminals:

```bash
# Web
pnpm --filter testcraft-web dev

# API
dotnet run --project apps/Api/src/TestCraft.Api
```

| Service    | URL                           |
| ---------- | ----------------------------- |
| Web        | http://localhost:3000         |
| API        | http://localhost:5000         |
| Swagger UI | http://localhost:5000/swagger |
| RabbitMQ   | http://localhost:15672        |
| MinIO      | http://localhost:9001         |
| Keycloak   | http://localhost:8080         |
| Mailpit    | http://localhost:8025         |
| Seq        | http://localhost:5341         |
| Grafana    | http://localhost:3001         |
| Prometheus | http://localhost:9090         |

### Running tests

```bash
pnpm --filter testcraft-web test   # Web (Vitest)
dotnet test apps/Api               # API (xUnit + Testcontainers)
make e2e                           # End-to-end (Playwright via act)
```

---

## Production

Requires k3s and Helm. Fill in `infrastructure/helm/testcraft/values.secrets.yaml` (not committed), then:

```bash
make deploy
```

Check rollout status at any time with `make status`.

---

## License

[MIT](LICENSE)
