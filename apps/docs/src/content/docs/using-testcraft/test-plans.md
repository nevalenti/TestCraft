---
title: Test Plans
description: Curate an ordered list of test cases and run them as a group.
sidebar:
  order: 2
---

A **test plan** is a curated, ordered subset of a project's test cases —
useful for a regression pass, a release checklist, or any set of cases you
want to execute together and repeatedly.

## Creating a plan

From the Test Plans list, create a plan with a Name and optional
Description. Opening a plan shows a two-panel layout:

- **Left panel** — test cases already in the plan, in execution order.
  Cases are **drag-and-drop reorderable**, and each has a remove button.
- **Right panel** — the project's remaining test cases (with search), each
  with an **Add** button to pull it into the plan.

## Running a plan

**Run Plan** opens a modal for a Run Name and optional Environment, then
creates a new test run pre-populated with one pending result per case in
the plan, in the plan's order, and takes you straight to that run — see
[Test Runs & Results](/docs/using-testcraft/test-runs-and-results/).
