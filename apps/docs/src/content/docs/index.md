---
title: TestCraft
description: A self-hosted, CI-native alternative to TestRail/Xray.
template: splash
hero:
  tagline: A self-hosted, CI-native alternative to TestRail/Xray.
  image:
    light: ../../assets/logo-light.svg
    dark: ../../assets/logo-dark.svg
  actions:
    - text: Get Started
      link: /docs/guides/getting-started/
      icon: right-arrow
    - text: View on GitHub
      link: https://github.com/nevalenti/TestCraft
      icon: external
      variant: minimal
---

## What it does

- **Test management** — projects → suites → test cases, test plans,
  JUnit/Allure import, file attachments
- **CI-native** — a first-party GitHub Action, a CLI reporter for everything
  else, and ready-to-use GitLab CI and Jenkins pipelines
- **Live test runs** — real-time progress over SignalR, shareable read-only
  links, webhook and email notifications
- **Self-hosted** — a Helm chart for k3s, with Prometheus, Grafana, Loki,
  and Seq built in

## Next steps

- [Get up and running locally](/docs/guides/getting-started/)
- [Wire up CI reporting](/docs/guides/ci-integration/)
- [Deploy to production](/docs/guides/production/)
