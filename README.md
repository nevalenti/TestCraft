# TestCraft

> Test management platform for teams — organise projects, suites, and test cases, import JUnit/Allure reports, track runs in real time, and get notified via email or webhooks.

**Built with:** React 19 · ASP.NET Core (.NET 10) · SignalR · PostgreSQL · MassTransit + RabbitMQ · MinIO · Keycloak · YARP · Prometheus/Grafana/Loki · Helm on k3s

---

## Features

- **Keycloak auth** — SSO with optional GitHub social login
- **Projects & suites** — projects → suites → test cases, drag-and-drop reordering
- **Test runs** — track progress in real time via SignalR; live log feed per pipeline run
- **JUnit / Allure import** — upload reports and have results mapped automatically to existing test cases
- **Attachments** — file uploads stored in MinIO, scoped to test results
- **Analytics** — pass/fail trend charts per project, configurable time window
- **Notifications** — email (SMTP) and outbound webhooks on run completion
- **Shareable links** — read-only run views via public share tokens
- **API tokens** — machine-to-machine access for CI pipelines
- **GitHub Action** — first-party action reports JUnit results, starts active runs, and uploads Playwright screenshots straight from CI
- **Accounts** — profile settings with avatar upload
- **Observability** — Prometheus metrics and Grafana dashboards ship out of the box alongside Loki/Seq log aggregation

---

## Architecture

```
apps/
  Api/src/
    TestCraft.Domain          # entities, domain events — no framework dependencies
    TestCraft.Application     # CQRS commands/queries (MediatR), interfaces
    TestCraft.Infrastructure  # EF Core, Redis, MinIO, MailKit, MassTransit
    TestCraft.Api             # ASP.NET Core controllers, SignalR hubs
  Gateway/src/                # YARP reverse proxy — fronts API + web in production
  web/                        # React SPA
    src/api/                  # Axios clients — one file per domain
    src/hooks/                # TanStack Query hooks + Zustand stores
    src/pages/                # Route components consuming hooks only
  e2e/                        # Playwright end-to-end suite
packages/
  types/                      # Shared TypeScript types
.github/actions/testcraft/    # GitHub Action that reports CI results into TestCraft
```

---

## Getting Started

**Prerequisites:** Docker, .NET 10 SDK, Node.js 22+, pnpm

```bash
git clone https://github.com/nevalenti/TestCraft.git
cd TestCraft
pnpm install
cp .env.example .env          # defaults work for local dev
make up                       # starts Postgres, Redis, RabbitMQ, Keycloak, MinIO, Mailpit, Seq, Prometheus, Grafana, Loki
```

Keycloak imports the `testcraft` realm automatically on first start. The API applies migrations on startup when `APPLY_MIGRATIONS=true` (set in `.env.example`).

Then in separate terminals:

```bash
# API
dotnet run --project apps/Api/src/TestCraft.Api

# Application
pnpm --filter testcraft-web dev
```

| Service     | URL                           |
| ----------- | ----------------------------- |
| API         | http://localhost:5000         |
| Application | http://localhost:3000         |
| Swagger UI  | http://localhost:5000/swagger |
| Keycloak    | http://localhost:8080         |
| Mailpit     | http://localhost:8025         |
| Seq         | http://localhost:5341         |
| MinIO       | http://localhost:9001         |
| Grafana     | http://localhost:3001         |
| Prometheus  | http://localhost:9090         |

### Running tests

```bash
pnpm --filter testcraft-web test   # Application (Vitest)
dotnet test apps/Api               # API (xUnit + Testcontainers)
make e2e                           # End-to-end (Playwright via act)
```

---

## Production

Requires k3s and Helm. Fill in `infrastructure/helm/testcraft/values.secrets.yaml` (not committed), then:

```bash
make deploy   # builds images, loads into k3s, upgrades the Helm release, waits for rollout
```

Check rollout status at any time with `make status`.

---

## License

[MIT](LICENSE)
