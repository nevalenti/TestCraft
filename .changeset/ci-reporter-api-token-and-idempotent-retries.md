---
"testcraft-ci-reporter": minor
---

Authenticate with a project API token: pass `--api-token` (`TESTCRAFT_API_TOKEN`) together with `--project-id` (`TESTCRAFT_PROJECT_ID`) and the reporter skips Keycloak entirely. `--project-id` also works with Keycloak credentials and skips the project lookup by name.

Creating runs, appending logs and queuing imports now send an `Idempotency-Key`, reused across retries, so a retried request never duplicates a run or log lines. Those requests, and GETs, are also retried on 502/503/504 responses, and on a 409 saying the first attempt with that key is still in progress.
