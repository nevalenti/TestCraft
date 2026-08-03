---
title: Running Tests
description: Run the API, web, and end-to-end test suites locally.
sidebar:
  order: 4
---

```bash
dotnet test TestCraft.slnx         # API — xUnit + Testcontainers
pnpm --filter testcraft-web test   # Web — Vitest
just github e2e                    # End-to-end — Playwright, via act
```

## API

Integration tests spin up Postgres via
[Testcontainers](https://testcontainers.com), so Docker must be running.

## Web

```bash
pnpm --filter testcraft-web test           # run once
pnpm --filter testcraft-web run test:watch # watch mode
pnpm --filter testcraft-web run test:ui    # Vitest UI
```

## End-to-end

The Playwright suite in `e2e` needs the full stack running (Postgres,
Keycloak, API, web). See [CI Integration](/docs/guides/ci-integration/) for
how results get reported back to TestCraft.

## Reproducing CI locally

`just github <api|web|e2e|docs>` (or `gitlab`/`jenkins`) runs each pipeline
locally — useful when a failure doesn't reproduce with a plain test run.
