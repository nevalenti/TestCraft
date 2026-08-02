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

## Features

Test management (suites, cases, plans, JUnit/Allure import, analytics), live
test runs, CI integration (GitHub Action, CLI, ready-made pipelines), Keycloak
accounts, and built-in observability. Full list in
[Using TestCraft](https://testcraft.pro/docs/guides/using-testcraft/).

---

## Stack

React 19 + ASP.NET Core (.NET 10), Clean Architecture behind a YARP gateway,
deployed via Helm on k3s. Details in
[Tech Stack](https://testcraft.pro/docs/reference/tech-stack/) and
[Architecture](https://testcraft.pro/docs/reference/architecture/).

---

## Getting Started

**Prerequisites:** Docker, .NET 10 SDK, Node.js 24, pnpm

```bash
git clone https://github.com/nevalenti/TestCraft.git && cd TestCraft
pnpm install && cp .env.example .env   # set APPLY_MIGRATIONS=true
make up
dotnet run --project apps/Api/src/TestCraft.Api   # separate terminal
pnpm --filter testcraft-web dev                    # separate terminal
```

Full setup, service URLs, tests, and production deployment (k3s + Helm):
[docs.testcraft.pro](https://testcraft.pro/docs/guides/getting-started/).

---

Licensed under [MIT](LICENSE).
