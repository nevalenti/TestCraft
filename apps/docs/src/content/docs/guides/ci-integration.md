---
title: CI Integration
description: Report test runs into TestCraft from GitHub Actions, GitLab CI, Jenkins, or any other CI system.
sidebar:
  order: 3
---

TestCraft imports JUnit XML results and streams live per-test logs from any CI
system: the first-party GitHub Action, or the `testcraft-ci-reporter` CLI for
everything else.

## Authentication

Both authenticate as a TestCraft **service account** (create one in Keycloak,
give it access to the relevant project) against Keycloak, then call the API:

- `api-url` — the TestCraft API base URL
- `username` / `password` — service account credentials
- `keycloak-authority` — optional; defaults to `api-url/api/auth-config`

The CLI (and Playwright reporter) also accept `--client-id`/`--client-secret`
(`TESTCRAFT_CLIENT_ID`/`TESTCRAFT_CLIENT_SECRET`) as an alternative to
`username`/`password`, using Keycloak's client-credentials grant. Only one
credential pair is required. The GitHub Action only supports
`username`/`password`.

## GitHub Action

[`.github/actions/testcraft`](https://github.com/nevalenti/TestCraft/tree/main/.github/actions/testcraft):

```yaml
- name: Start TestCraft run
  id: testcraft-start
  uses: ./.github/actions/testcraft
  with:
    command: start
    username: ${{ secrets.TESTCRAFT_USERNAME }}
    password: ${{ secrets.TESTCRAFT_PASSWORD }}
    api-url: ${{ secrets.TESTCRAFT_API_URL }}
    project-name: TestCraft
    run-name: '#${{ github.run_id }} api (${{ github.ref_name }})'
    source: api

- name: Run tests
  env:
    TESTCRAFT_RUN_ID: ${{ steps.testcraft-start.outputs.run-id }}
    TESTCRAFT_API_URL: ${{ secrets.TESTCRAFT_API_URL }}
  run: dotnet test

- name: Import results to TestCraft
  if: always()
  uses: ./.github/actions/testcraft
  with:
    username: ${{ secrets.TESTCRAFT_USERNAME }}
    password: ${{ secrets.TESTCRAFT_PASSWORD }}
    api-url: ${{ secrets.TESTCRAFT_API_URL }}
    project-name: TestCraft
    junit-xml: apps/Api/test-results/*.junit.xml
    run-name: '#${{ github.run_id }} api (${{ github.ref_name }})'
    source: api
    screenshots-dir: e2e/test-results # optional, Playwright only
```

Map the `start` step's `run-id` output into `TESTCRAFT_RUN_ID` in your test
step's `env:` (shown above) — the [VSTest logger](#live-test-logs) and
Playwright reporter pick it up automatically to stream live per-test logs.

| Input                   | Required | Description                                                                         |
| ----------------------- | -------- | ----------------------------------------------------------------------------------- |
| `command`               | no       | `start` creates an Active run before tests; default `import` imports results after  |
| `username` / `password` | no       | Service account credentials                                                         |
| `api-url`               | no       | TestCraft API base URL — omitted makes the step a no-op                             |
| `project-name`          | yes      | Project to import results into                                                      |
| `junit-xml`             | no       | Path or single-directory glob to a JUnit XML report — required for `import`         |
| `run-name`              | yes      | Display name for the run                                                            |
| `keycloak-authority`    | no       | Public Keycloak authority — skips the `auth-config` lookup when set                 |
| `source`                | no       | Source tag for test suites (`api`, `web`, `e2e`, ...)                               |
| `screenshots-dir`       | no       | Playwright `test-results` directory — uploads PNGs as attachments to failed results |

## `testcraft-ci-reporter` CLI

For GitLab CI, Jenkins, or any other system. Build from source (npm package
isn't published yet):

```bash
pnpm --filter testcraft-ci-reporter run build
```

| Command  | Purpose                                       | Key flags                                       |
| -------- | ---------------------------------------------- | ------------------------------------------------ |
| `start`  | Create a run before tests                     | `--dotenv <path>` writes `TESTCRAFT_RUN_ID` to a file to `source` later |
| `import` | Import JUnit XML results after tests          | `--junit-xml <glob>`                            |
| `logs`   | Stream a log file to an existing run          | `--run-id`/`TESTCRAFT_RUN_ID`, `--file`/`TESTCRAFT_LOG_FILE` |

```bash
node packages/ci-reporter/dist/cli.js import \
  --project-name TestCraft \
  --junit-xml "apps/Api/test-results/*.junit.xml" \
  --run-name "#42 api (main)" \
  --source api
```

Every flag has an env var equivalent (`--api-url` ↔ `TESTCRAFT_API_URL`,
etc.) — see the bundled [Jenkinsfiles](https://github.com/nevalenti/TestCraft/tree/main/jenkins)
and [GitLab CI](https://github.com/nevalenti/TestCraft/tree/main/.gitlab/ci)
pipelines for complete examples.

## Live test logs

Two loggers stream per-test pass/fail lines to a run in real time:

- **.NET** — `TestCraft.VSTestLogger`, no-op unless `TESTCRAFT_API_URL`,
  `TESTCRAFT_RUN_ID`, `TESTCRAFT_USERNAME`, `TESTCRAFT_PASSWORD`, and
  `TESTCRAFT_PROJECT_NAME` are all set.
- **Playwright** — `e2e/reporter.ts`, active only when `TESTCRAFT_RUN_ID` is set.
