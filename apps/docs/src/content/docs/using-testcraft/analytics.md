---
title: Dashboard & Analytics
description: Track run activity at a glance and dig into trends, flaky tests, and regressions.
sidebar:
  order: 4
---

## Dashboard

The home dashboard gives an at-a-glance view across every project:

- Stat cards for total Projects, Test Runs, and Test Suites, each linking
  out to that list.
- **Active Runs** — runs still in progress, polling every 5 seconds, with a
  live pass/fail count and progress bar.
- **Recently Completed** — the latest completed runs with their pass rate
  and pass/fail counts.

## Project analytics

Each project's **Analytics** tab has four views:

- **Trend** — a per-source pass-rate chart over time, with latest, delta,
  average, and best stats alongside it.
- **Flaky Tests** — test cases ranked by flake rate, bucketed into risk
  levels: **High** (≥60%), **Medium** (30–59%), **Low** (&lt;30%).
- **Suite Breakdown** — pick a run and see a stacked bar chart of
  Passed/Failed/Blocked/Skipped per suite.
- **Run Comparison** — pick two runs and get a per-case diff table, each
  case flagged **Regression**, **Fixed**, or **Unchanged**, with a filter to
  show only changes.
