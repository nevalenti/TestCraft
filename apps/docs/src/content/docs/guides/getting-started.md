---
title: Getting Started
description: Run TestCraft locally.
sidebar:
  order: 1
---

**Prerequisites:** Docker, .NET 10 SDK, Node.js 24, pnpm

```bash
git clone https://github.com/nevalenti/TestCraft.git
cd TestCraft
pnpm install
cp .env.example .env
```

`APPLY_MIGRATIONS` defaults to `false` in `.env.example`, so set it to `true`
in `.env` before starting the stack, or the database schema stays empty and
the API fails on first request:

```bash
make up
```

Keycloak imports the `testcraft` realm automatically on first start.

Then in separate terminals:

```bash
# API
dotnet run --project apps/Api/src/TestCraft.Api

# Web
pnpm --filter testcraft-web dev
```

| Service    | URL                            |
| ---------- | ------------------------------ |
| Web        | http://localhost:3000          |
| API        | http://localhost:5000          |
| Swagger UI | http://localhost:5000/api/docs |
| RabbitMQ   | http://localhost:15672         |
| MinIO      | http://localhost:9001          |
| Keycloak   | http://localhost:8080          |
| Mailpit    | http://localhost:8025          |
| Seq        | http://localhost:5341          |
| Grafana    | http://localhost:3001          |
| Prometheus | http://localhost:9090          |

Once Web and API are both up, sign in and start creating projects, suites,
and test cases. If something in this stack isn't behaving, check
[Troubleshooting](/docs/guides/troubleshooting/) before digging further.
