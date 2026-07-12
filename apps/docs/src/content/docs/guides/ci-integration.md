---
title: CI Integration
description: Report test runs into TestCraft from GitHub Actions, GitLab CI, Jenkins, or any other CI system.
sidebar:
  order: 2
---

TestCraft imports JUnit XML results and streams live per-test logs from any CI
system. There are two ways to report into it: the first-party GitHub Action,
or the `@testcraft/ci-reporter` CLI for everything else.

## Authentication

Both the action and the CLI authenticate as a TestCraft **service account**
against Keycloak, then call the TestCraft API. You'll need:

- `api-url` — the TestCraft API base URL
- `username` / `password` — a service account's credentials
- `keycloak-authority` — optional; when omitted it's fetched from
  `api-url/api/auth-config`

Service accounts are managed like any other TestCraft user — create one in
Keycloak and give it access to the relevant project.

## GitHub Action

The composite action at [`.github/actions/testcraft`](https://github.com/nevalenti/TestCraft/tree/main/.github/actions/testcraft)
supports two commands:

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
    run-name: "#${{ github.run_id }} api (${{ github.ref_name }})"
    source: api

# ... run your tests, then:

- name: Import results to TestCraft
  if: always()
  uses: ./.github/actions/testcraft
  with:
    username: ${{ secrets.TESTCRAFT_USERNAME }}
    password: ${{ secrets.TESTCRAFT_PASSWORD }}
    api-url: ${{ secrets.TESTCRAFT_API_URL }}
    project-name: TestCraft
    junit-xml: apps/Api/test-results/*.junit.xml
    run-name: "#${{ github.run_id }} api (${{ github.ref_name }})"
    source: api
    screenshots-dir: apps/e2e/test-results # optional, Playwright only
```

| Input                   | Required | Description                                                                         |
| ----------------------- | -------- | ----------------------------------------------------------------------------------- |
| `command`               | no       | `start` creates an Active run before tests; default `import` imports results after  |
| `username` / `password` | no       | Service account credentials — omitted `api-url` makes the step a no-op              |
| `api-url`               | no       | TestCraft API base URL                                                              |
| `project-name`          | yes      | Project to import results into                                                      |
| `junit-xml`             | no       | Path or single-directory glob to a JUnit XML report — required for `import`         |
| `run-name`              | yes      | Display name for the run                                                            |
| `keycloak-authority`    | no       | Public Keycloak authority — skips the `api-url/api/auth-config` lookup when set     |
| `source`                | no       | Source tag for test suites (`api`, `web`, `e2e`, ...)                               |
| `screenshots-dir`       | no       | Playwright `test-results` directory — uploads PNGs as attachments to failed results |

The `start` command's `run-id` output feeds `TESTCRAFT_RUN_ID` into the test
step's environment, which the [VSTest logger](#live-test-logs) and Playwright
reporter pick up automatically to stream live per-test logs.

## `@testcraft/ci-reporter` CLI

For GitLab CI, Jenkins, or any other CI system, use the CLI equivalent. It
isn't published to a registry — build it from source in the pipeline, either
by running the bundled esbuild output with `node` or by building the image
from [`packages/ci-reporter/Dockerfile`](https://github.com/nevalenti/TestCraft/tree/main/packages/ci-reporter/Dockerfile).

```bash
# build once (or build the Docker image instead — see below)
pnpm --filter @testcraft/ci-reporter run build

# start a run before tests
node packages/ci-reporter/dist/cli.js start \
  --project-name TestCraft \
  --run-name "#42 api (main)" \
  --source api \
  --dotenv .testcraft.env

# ... run your tests ...

# import results after
node packages/ci-reporter/dist/cli.js import \
  --project-name TestCraft \
  --junit-xml "apps/Api/test-results/*.junit.xml" \
  --run-name "#42 api (main)" \
  --source api

# stream a log file to an existing run
node packages/ci-reporter/dist/cli.js logs \
  --project-name TestCraft \
  --run-name "#42 api (main)" \
  --source api \
  --run-id "$TESTCRAFT_RUN_ID" \
  --file build.log
```

Or, via the Docker image (what the Jenkinsfiles do):

```bash
docker build -t testcraft-ci-reporter -f packages/ci-reporter/Dockerfile .
docker run --rm -w /repo -v "$PWD:/repo" \
  -e TESTCRAFT_USERNAME -e TESTCRAFT_PASSWORD -e TESTCRAFT_API_URL \
  testcraft-ci-reporter import \
  --project-name TestCraft \
  --junit-xml "apps/Api/test-results/*.junit.xml" \
  --run-name "#42 api (main)" \
  --source api
```

Every flag has an environment variable equivalent (`--api-url` ↔
`TESTCRAFT_API_URL`, `--project-name` ↔ `TESTCRAFT_PROJECT_NAME`, etc.), which
is how the bundled [Jenkinsfiles](https://github.com/nevalenti/TestCraft/tree/main/jenkins)
and [GitLab CI](https://github.com/nevalenti/TestCraft/tree/main/.gitlab/ci)
pipelines wire it up — see those directories for complete, working examples
for API, web, and E2E suites.

Commands: `start`, `import`, `logs`. `start --dotenv <path>` writes
`TESTCRAFT_RUN_ID=<id>` to a file you can `source` into later pipeline steps.
`logs` requires `--run-id` (or `TESTCRAFT_RUN_ID`) and `--file` (or
`TESTCRAFT_LOG_FILE`) — it uploads the file's lines as run logs and no-ops if
the file doesn't exist yet.

## Live test logs

Two loggers stream per-test pass/fail lines to a run in real time, so you can
watch a suite execute from the TestCraft dashboard instead of tailing CI
output:

- **.NET** — `TestCraft.VSTestLogger` (registered via each test project's
  `<VSTestLogger>` MSBuild property). It's a no-op unless `TESTCRAFT_API_URL`,
  `TESTCRAFT_RUN_ID`, `TESTCRAFT_USERNAME`, `TESTCRAFT_PASSWORD`, and
  `TESTCRAFT_PROJECT_NAME` are all set, so it's safe to leave enabled outside CI.
- **Playwright** — `apps/e2e/reporter.ts`, added to `playwright.config.ts`'s
  reporter list only when `TESTCRAFT_RUN_ID` is set.
