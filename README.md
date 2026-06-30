# TestCraft

A test management platform for organising projects, test suites, test cases, and test runs — with import support for JUnit and Allure reports, real-time run tracking, email/webhook notifications, and analytics.

## Stack

- **Frontend** — React 19, Vite, TanStack Router, DaisyUI
- **Backend** — .NET 9, EF Core, MassTransit, SignalR
- **Gateway** — YARP reverse proxy
- **Auth** — Keycloak
- **Infra** — PostgreSQL, RabbitMQ, Redis, MinIO, Mailpit (dev)

## Local Development

**Prerequisites:** Docker, .NET 9 SDK, Node.js 20+, pnpm

```bash
# 1. Clone and install dependencies
git clone https://github.com/nevalenti/TestCraft.git
cd TestCraft
pnpm install

# 2. Configure environment
cp .env.example .env
# Edit .env — defaults work out of the box for local dev

# 3. Start infrastructure
make up

# 4. Run the API
cd apps/Api
dotnet run --project src/TestCraft.Api

# 5. Run the frontend
cd apps/web
pnpm dev
```

App runs at `http://localhost:5173`. Keycloak admin at `http://localhost:8080`. Mailpit (email preview) at `http://localhost:8025`.

## Production Deployment

Deployed via Helm on k3s.

```bash
# Fill in values.secrets.yaml, then:
make deploy
```

## License

MIT
