---
title: Getting Started
description: Run TestCraft locally.
sidebar:
  order: 1
---

## Prerequisites

- Docker, to run Postgres, Redis, RabbitMQ, MinIO, Keycloak, and the rest of
  the stack via `just up`
- .NET 10 SDK, to run the API outside its container (`dotnet run`)
- Node.js 24 + pnpm, to run the web app outside its container

```bash
git clone https://github.com/nevalenti/TestCraft.git
cd TestCraft
pnpm install
cp .env.example .env
```

Set `APPLY_MIGRATIONS=true` in `.env` before starting, or the database schema
stays empty and the API fails on first request:

```bash
just up
```

This also imports the `testcraft` Keycloak realm automatically.

Then in separate terminals:

```bash
# API
dotnet run --project apps/Api/src/TestCraft.Api

# Web
pnpm --filter testcraft-web dev
```

Web: http://localhost:3000 · API: http://localhost:5000 · Swagger UI:
http://localhost:5000/api/docs

Sign in and start creating projects, suites, and test cases. Stuck? See
[Troubleshooting](/docs/guides/troubleshooting/).
