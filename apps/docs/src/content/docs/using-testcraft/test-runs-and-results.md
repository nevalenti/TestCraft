---
title: Test Runs & Results
description: Create runs, import results, track live progress, and share them.
sidebar:
  order: 3
---

A **test run** is an execution pass against a project — created manually,
from a [test plan](/docs/using-testcraft/test-plans/), or imported straight
from CI (see [CI Integration](/docs/guides/ci-integration/)). Each run has a
Name, optional Environment, and a status of `Active`, `Completed`, or
`Archived`.

## Creating and importing

From the Test Runs tab, **New Run** creates an empty run (Name,
Environment, Status). **Import** accepts a JUnit XML or Allure JSON report
and queues an asynchronous import job — the API responds immediately with
`202 Accepted` and a job id, which the web app polls
(`GET /import/{id}`, status `Pending` → `Processing` → `Completed`/`Failed`)
until the run is created with results mapped automatically to existing test
cases by name.

## Results

Each result within a run has a status — `Passed`, `Failed`, `Blocked`, or
`Skipped` — plus optional Notes, and, only when the status is `Failed`, a
**Defect Type**: `ProductBug`, `AutomationBug`, `EnvironmentIssue`, or
`ToInvestigate`. Edit these from the results table.

## Views

A run has three view modes:

- **Table** — paginated, sortable results with status filter and search;
  the summary bar shows counts per status and an **Add Result** action.
- **Live** — a real-time feed of results as they arrive, pushed over
  SignalR (no polling/refresh needed). Shows a **Live**/**Completed**
  badge and color-codes each result by status as it streams in — this is
  what the [live test loggers](/docs/guides/ci-integration/#live-test-logs)
  from CI feed into.
- **Logs** — a terminal-style panel of raw pipeline output for the run,
  auto-scrolling as new lines arrive.

## Attachments

Each result can have file attachments — click its attachment icon to
upload, view size/date, download (opens a signed URL), or delete. CI
imports can attach Playwright failure screenshots automatically.

## Sharing

The share icon on a run opens a modal to create a public, unauthenticated
share link (`{your-domain}/share/{token}`), with an optional expiry date —
"Anyone with this link can view the run results without logging in." The
same modal lists and lets you revoke active links. The shared page shows
the run name, environment, stat tiles per status, overall pass rate, and a
read-only results table — nothing else in TestCraft is exposed.
