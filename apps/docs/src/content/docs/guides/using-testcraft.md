---
title: Using TestCraft
description: Projects, suites, test cases, runs, plans, analytics, and notifications from the web app.
sidebar:
  order: 2
---

The web app, once you're past [getting started](/docs/guides/getting-started/).
For reporting results _from_ CI, see [CI Integration](/docs/guides/ci-integration/).

## Projects, suites, and test cases

A project contains **test suites**, each suite contains **test cases**, and
each test case has an ordered list of **steps** (action + expected result,
drag-and-drop reorderable).

| Field    | Values                                                         |
| -------- | -------------------------------------------------------------- |
| Priority | `Low` / `Medium` / `High` / `Critical`                         |
| Labels   | Colored tags, created on the **Labels** tab, assigned per case |

## Test plans

A curated, ordered subset of a project's test cases, independent of suite
boundaries — useful for a regression pack or release checklist. Add cases
from the plan's detail page, reorder by drag handle, then **Run Plan** to
create a test run from exactly that list.

Reach a project's plans at `/projects/<project-id>/plans` (no nav tab yet).

## Test runs

Tracks pass/fail/blocked/skipped results for a set of test cases in one
environment. Create manually (**New Run**), from a test plan, or from CI
(GitHub Action or `testcraft-ci-reporter` CLI `start` command).

A failed result also records a defect type: `ProductBug` / `AutomationBug` /
`EnvironmentIssue` / `ToInvestigate`. Screenshots and other files attach to
individual results.

| View  | Shows                                                                                                                |
| ----- | -------------------------------------------------------------------------------------------------------------------- |
| Table | Results grid, filterable by status, searchable by name                                                               |
| Live  | Real-time per-test pass/fail feed while CI is still running ([details](/docs/guides/ci-integration/#live-test-logs)) |
| Logs  | Raw pipeline log stream, pushed live from the `logs` CLI subcommand                                                  |

The share icon creates a public, read-only link (`/share/<token>`),
optionally with an expiry. Revoke it any time.

## Importing results

The **Import** button (next to **New Run**) accepts a JUnit XML file or
Allure JSON files directly in the browser, matching them onto existing
suites/cases by name — unmatched suites/cases are created automatically.
For the CI-driven equivalent, see [CI Integration](/docs/guides/ci-integration/).

## Analytics

| View            | Shows                                                                                  |
| --------------- | -------------------------------------------------------------------------------------- |
| Trend           | Pass-rate over time                                                                    |
| Flaky Tests     | Cases alternating pass/fail, ranked by flake rate (high ≥60%, medium 30–60%, low <30%) |
| Suite Breakdown | Pass/fail counts by suite                                                              |
| Run Comparison  | Diff two runs                                                                          |

## Project settings

- **Notifications** — webhooks (URL + optional HMAC-SHA256 secret) and email,
  both triggered on `run.completed`. Email needs SMTP configured, see
  [Environment Variables](/docs/reference/environment-variables/).
- **Members** — owners invite collaborators by email; access is immediate.
- **API Tokens** — create/revoke named, optionally expiring tokens. Shown
  once at creation, unrecoverable after.

## Account

Top-right avatar — profile, photo upload, and a link to Keycloak's account
console for editing name/email/password.
