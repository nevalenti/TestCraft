---
title: Running Tests
description: Run the API, web, and end-to-end test suites locally.
sidebar:
  order: 3
---

```bash
dotnet test TestCraft.slnx         # API — xUnit + Testcontainers
pnpm --filter testcraft-web test   # Web — Vitest
make e2e-github                    # End-to-end — Playwright, via act
```

## API

`TestCraft.Api.IntegrationTests` spins up Postgres via
[Testcontainers](https://testcontainers.com), so Docker must be running.
Coverage is collected with `apps/Api/coverlet.runsettings` (40% line floor —
ratchet it up, never down) and enforced in CI via
`--collect:"XPlat Code Coverage" --settings apps/Api/coverlet.runsettings`.

## Web

```bash
pnpm --filter testcraft-web test           # run once
pnpm --filter testcraft-web run test:watch # watch mode
pnpm --filter testcraft-web run test:ui    # Vitest UI
```

## End-to-end

The Playwright suite in `apps/e2e` needs the full stack running — Postgres,
Keycloak, the API, and the web app. `make e2e-github`/`make e2e-gitlab`/
`make e2e-jenkins` reproduce the exact CI pipelines locally using
[`act`](https://github.com/nektos/act), [`gitlab-ci-local`](https://github.com/firecow/gitlab-ci-local),
or a throwaway Jenkins controller, respectively — see
[CI Integration](/docs/guides/ci-integration/) for how results get reported
back to TestCraft.

## Reproducing CI locally

Beyond the E2E suite, `make api-github` / `make api-gitlab` / `make web-github`
/ `make web-gitlab` run the other pipelines through the same local emulators.
This is the most reliable way to debug a pipeline failure that doesn't
reproduce with a plain local `dotnet test`/`pnpm test` run.
