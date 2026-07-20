---
title: Using TestCraft
description: Projects, suites, test cases, runs, plans, analytics, and notifications from the web app.
sidebar:
  order: 6
---

This covers the product itself — the web app at `/`, once you're past
[getting started](/docs/guides/getting-started/). For reporting results in
_from_ a CI pipeline, see [CI Integration](/docs/guides/ci-integration/).

## Projects, suites, and test cases

Everything lives under a project. A project contains **test suites**, and
each suite contains **test cases**. A test case has a name, description,
priority (`Low` / `Medium` / `High` / `Critical`), and an ordered list of
**steps** (action + expected result). Steps support drag-and-drop reordering
on the test case page.

Test cases can carry **labels** — colored tags created per-project on the
**Labels** tab and assigned from the test case page.

Suites and runs both track a `source` field (e.g. `api`, `web`, `e2e`) so
results from different test suites/pipelines stay distinguishable in list
views — it's set automatically when results are reported from CI (see
[CI Integration](/docs/guides/ci-integration/)) rather than typed in by hand.

## Test plans

A test plan is an ordered, curated subset of a project's test cases,
independent of suite boundaries — useful for a regression pack or a release
checklist that pulls cases from several suites. Add cases from the plan's
detail page (search + add from the right-hand panel), reorder them by drag
handle, then **Run Plan** to create a test run pre-populated with exactly
that case list, in that order.

Test plans don't currently have a project nav tab — reach a project's plans
at `/projects/<project-id>/plans`.

## Test runs

A test run tracks pass/fail/blocked/skipped results for a set of test cases
in one environment. Create one manually (**New Run**, with a name,
environment, and status of `Active` / `Completed` / `Archived`), start one
from a test plan, or let CI create one via the GitHub Action's `start`
command or the `testcraft-ci-reporter` CLI's `start` subcommand.

Each result records a status, optional notes, and a defect type
(`ProductBug` / `AutomationBug` / `EnvironmentIssue` / `ToInvestigate`) once
it's marked failed. Screenshots and other files attach to individual results
(uploaded to MinIO).

A run has three views:

- **Table** — the results grid, filterable by status and searchable by test
  case name.
- **Live** — a real-time per-test pass/fail feed over SignalR, populated by
  the VSTest logger or Playwright reporter while a CI job is still running
  (see [CI Integration](/docs/guides/ci-integration/#live-test-logs)).
- **Logs** — the raw pipeline log stream for the run, also pushed live over
  SignalR.

### Sharing a run

The share icon on a run opens a dialog to create a **share token** — a
public, unauthenticated, read-only link (`/share/<token>`) to that run's
results, optionally with an expiry date. Revoke a link at any time from the
same dialog; revoked or expired links 404.

## Importing results

Beyond CI-driven reporting, a project's **Import** button (next to **New
Run**) accepts a JUnit XML file or one or more Allure JSON result files
directly in the browser, mapping them onto existing test cases by name and
creating a new run from them. See
[CI Integration](/docs/guides/ci-integration/) for the equivalent
machine-driven import path used by pipelines.

## Analytics

Each project has four analytics views:

- **Trend** — pass-rate trend across runs over time.
- **Flaky Tests** — test cases whose results alternate between pass and fail
  across runs, ranked by flake rate (high ≥ 60%, medium 30–60%, low < 30%).
- **Suite Breakdown** — pass/fail counts grouped by suite.
- **Run Comparison** — diff results between two runs.

## Notifications

Project Settings → **Notifications** configures two independent delivery
mechanisms, both triggered on `RunCompleted` and `FailureThresholdExceeded`:

- **Webhooks** — a URL plus an optional secret used for HMAC-SHA256 request
  signing, so the receiver can verify the payload came from TestCraft.
- **Email** — one or more subscriber addresses; actually sending requires
  the SMTP settings in
  [Environment Variables](/docs/reference/environment-variables/) to be
  configured.

## Project members

Project owners can invite collaborators from Project Settings → **Members**
by email. Existing TestCraft users gain access to the project immediately;
the Members tab itself is only visible to the project owner.

## API tokens

Project Settings → **API Tokens** lets you create and revoke named,
optionally-expiring tokens per project. The raw token is shown once, at
creation time, and isn't recoverable afterward.

## Account

The **Account** page (top-right avatar) shows your Keycloak profile
(first/last name, username, email) and lets you upload a profile photo
(JPEG/PNG/WebP/GIF, stored in MinIO). Full profile edits — name, email,
password — happen in Keycloak's own account console, linked from **Manage
account** on the same page.
