# TestCraft

> Test management platform for teams — organise projects, suites, and test cases, import JUnit/Allure reports, track runs in real time, and get notified via email or webhooks.

---

## Tech Stack

| Layer    | Tech                                     |
| -------- | ---------------------------------------- |
| Frontend | React 19, Vite, TanStack Router, DaisyUI |
| Backend  | .NET 9, EF Core, MassTransit, SignalR    |
| Gateway  | YARP                                     |
| Auth     | Keycloak                                 |
| Infra    | PostgreSQL · Redis · RabbitMQ · MinIO    |

---

## Getting Started

**Prerequisites:** Docker, .NET 9 SDK, Node.js 20+, pnpm

```bash
git clone https://github.com/nevalenti/TestCraft.git
cd TestCraft
pnpm install
cp .env.example .env   # defaults work for local dev
make up                # start infrastructure
```

Then in separate terminals:

```bash
# API
dotnet run --project apps/Api/src/TestCraft.Api

# Frontend
pnpm --filter web dev
```

| Service  | URL                   |
| -------- | --------------------- |
| App      | http://localhost:5173 |
| Keycloak | http://localhost:8080 |
| Mailpit  | http://localhost:8025 |

---

## Production

Deployed via Helm on k3s. Fill in `infrastructure/helm/testcraft/values.secrets.yaml`, then:

```bash
make deploy
```

---

## License

[MIT](LICENSE)
