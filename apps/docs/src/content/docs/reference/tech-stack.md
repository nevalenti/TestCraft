---
title: Tech Stack
description: What each layer of TestCraft is built with.
sidebar:
  order: 2
---

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

## Monorepo tooling

- **pnpm** workspaces (`apps/*`, `packages/*`, `.github/actions/*`) +
  **Turborepo** for task orchestration (`pnpm build`, `pnpm test`, etc. all
  fan out via `turbo.json`)
- **TypeScript** across the web app, e2e suite, ci-reporter, and docs site
- **xUnit** + **Testcontainers** for .NET integration tests
- **Vitest** for TypeScript unit tests

See [Architecture](/docs/reference/architecture/) for how these map onto the
repository layout.
