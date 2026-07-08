<div align="center">

# <img src=".github/assets/logo.svg" width="32" height="32" alt="TestCraft logo" align="center" /> TestCraft

**A self-hosted, CI-native alternative to TestRail/Xray**

[![API](https://github.com/nevalenti/TestCraft/actions/workflows/api.yml/badge.svg)](https://github.com/nevalenti/TestCraft/actions/workflows/api.yml)
[![Web](https://github.com/nevalenti/TestCraft/actions/workflows/web.yml/badge.svg)](https://github.com/nevalenti/TestCraft/actions/workflows/web.yml)
[![E2E](https://github.com/nevalenti/TestCraft/actions/workflows/e2e.yml/badge.svg)](https://github.com/nevalenti/TestCraft/actions/workflows/e2e.yml)
<br>
[![.NET 10](https://img.shields.io/badge/.NET-10-512BD4?logo=dotnet&logoColor=white)](apps/Api)
[![React 19](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](apps/web)
<br>
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
<br>

</div>

---

## Contents

- [Features](#features)
- [Built With](#built-with)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [Production](#production)
- [License](#license)

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
- **CI reporter CLI** — `@testcraft/ci-reporter`, an npx/Docker equivalent of the GitHub Action for CI systems without native support
- **Pipeline examples** — ready-to-use pipelines for [GitHub Actions](.github/workflows), [GitLab CI](.gitlab-ci.yml), and [Jenkins](jenkins) covering API, web, and E2E suites
- **API tokens** — machine-to-machine access for CI pipelines

### Accounts & access

- **Keycloak auth** — SSO with optional GitHub social login
- **Project members** — invite collaborators to projects for shared access
- **Accounts** — profile settings with avatar upload

### Observability

- Prometheus metrics and Grafana dashboards ship out of the box, alongside Loki/Seq log aggregation

---

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

## Architecture

```
apps/
  Api/src/
    TestCraft.Domain         # Entities, domain events
    TestCraft.Application    # CQRS (MediatR)
    TestCraft.Infrastructure # EF Core, Redis, MinIO, MailKit, MassTransit
    TestCraft.Api            # Controllers, SignalR hubs
  Gateway/src/               # YARP reverse proxy (Web + API)
  web/                       # React SPA
    src/api/                 # Axios clients, one per domain
    src/hooks/               # TanStack Query hooks, one per domain
    src/stores/              # Zustand stores
    src/pages/               # Route components (hooks only)
    src/layout/              # App shell
    src/components/          # Shared components, ui/ primitives
    src/auth/                # Keycloak provider
    src/contexts/            # React contexts (theme)
    src/lib/                 # Shared helpers
    src/types/               # Shared frontend types
    src/__tests__/           # Vitest tests
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
.gitlab-ci.yml               # GitLab CI pipelines
.gitlab/ci/                  # GitLab CI pipelines
```

---

## Getting Started

**Prerequisites:** Docker, .NET 10 SDK, Node.js 24, pnpm

```bash
git clone https://github.com/nevalenti/TestCraft.git
cd TestCraft
pnpm install
cp .env.example .env
make up
```

Keycloak imports the `testcraft` realm automatically on first start. The API applies migrations on startup when `APPLY_MIGRATIONS=true` is set in `.env`.

Then in separate terminals:

```bash
# API
dotnet run --project apps/Api/src/TestCraft.Api

# Web
pnpm --filter testcraft-web dev
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
dotnet test TestCraft.slnx         # API (xUnit + Testcontainers)
pnpm --filter testcraft-web test   # Web (Vitest)
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
