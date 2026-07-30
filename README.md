<div align="center">

# <img src=".github/assets/logo.svg" width="32" height="32" alt="TestCraft logo" align="center" /> TestCraft

**A self-hosted, CI-native alternative to TestRail/Xray**

[![API](https://github.com/nevalenti/TestCraft/actions/workflows/api.yml/badge.svg)](https://github.com/nevalenti/TestCraft/actions/workflows/api.yml)
[![Web](https://github.com/nevalenti/TestCraft/actions/workflows/web.yml/badge.svg)](https://github.com/nevalenti/TestCraft/actions/workflows/web.yml)
[![E2E](https://github.com/nevalenti/TestCraft/actions/workflows/e2e.yml/badge.svg)](https://github.com/nevalenti/TestCraft/actions/workflows/e2e.yml)
[![Gateway](https://github.com/nevalenti/TestCraft/actions/workflows/gateway.yml/badge.svg)](https://github.com/nevalenti/TestCraft/actions/workflows/gateway.yml)
[![Docs](https://github.com/nevalenti/TestCraft/actions/workflows/docs.yml/badge.svg)](https://github.com/nevalenti/TestCraft/actions/workflows/docs.yml)
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
- **CI reporter CLI** — `testcraft-ci-reporter`, an npx/Docker equivalent of the GitHub Action for CI systems without native support
- **Pipeline examples** — ready-to-use pipelines for [GitHub Actions](.github/workflows), [GitLab CI](.gitlab-ci.yml), and [Jenkins](jenkins) covering API, web, and E2E suites
- **API tokens** — machine-to-machine access for CI pipelines

### Accounts & access

- **Keycloak auth** — SSO with optional GitHub and Google social login
- **Project members** — invite collaborators to projects for shared access
- **Accounts** — profile settings with avatar upload

### Observability

- Prometheus metrics and Grafana dashboards ship out of the box, alongside Loki/Seq log aggregation

---

## Built With

React 19 · ASP.NET Core (.NET 10) · PostgreSQL · Redis · RabbitMQ + MassTransit
· SignalR · MinIO · Keycloak · YARP · Grafana/Prometheus/Loki/Seq · Helm on
k3s

See [Tech Stack](https://testcraft.pro/docs/reference/tech-stack/) for what
each layer is used for.

---

## Architecture

Clean Architecture on the API (`Domain` → `Application` → `Infrastructure` →
`Api`), a YARP Gateway as the single public entry point in front of the
API/web/docs/observability stack, and a React SPA that mirrors the API's
layering (`api/` → `hooks/` → `pages/`).

See [Architecture](https://testcraft.pro/docs/reference/architecture/) for
the full repository layout and module boundaries.

---

## Getting Started

**Prerequisites:** Docker, .NET 10 SDK, Node.js 24, pnpm

```bash
git clone https://github.com/nevalenti/TestCraft.git
cd TestCraft
pnpm install
cp .env.example .env
```

`APPLY_MIGRATIONS` defaults to `false` in `.env.example` — set it to `true`
in `.env` before starting the stack, or the database schema stays empty and
the API fails on first request:

```bash
make up
```

Keycloak imports the `testcraft` realm automatically on first start. Then in
separate terminals:

```bash
# API
dotnet run --project apps/Api/src/TestCraft.Api

# Web
pnpm --filter testcraft-web dev
```

See [Getting Started](https://testcraft.pro/docs/guides/getting-started/) for
local service URLs, and [Running Tests](https://testcraft.pro/docs/guides/testing/)
for the API/web/E2E test suites.

---

## Production

Requires k3s and Helm. Fill in `infrastructure/helm/testcraft/values.secrets.yaml` (not committed), then:

```bash
make deploy
```

Check rollout status at any time with `make status`. See
[Production Deployment](https://testcraft.pro/docs/guides/production/) for
TLS, secrets rotation, backups, and continuous deployment.

---

## License

[MIT](LICENSE)
