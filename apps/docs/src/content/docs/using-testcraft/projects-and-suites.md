---
title: Projects, Suites & Test Cases
description: Organize test cases into projects and suites.
sidebar:
  order: 1
---

Everything in TestCraft lives inside a **project**. Projects contain **test
suites**, which contain **test cases**, which contain **test case steps**.

## Projects

From the Projects page, **New Project** opens a form with a Name (required,
up to 255 characters) and an optional Description (up to 1000 characters).
Use the grid/list toggle and search box to find existing ones; each project
card has Edit and Delete actions (delete asks for confirmation and cannot be
undone).

Opening a project shows four tabs: **Test Runs**, **Test Suites**,
**Analytics**, and **Labels** (Runs and Suites show live count badges).

## Test suites

The Test Suites tab lists suites in the project — search, grid/list toggle,
a source filter, and create/edit/delete (Name + Description). Opening a
suite lists its test cases, again with search and a grid/list toggle.

## Test cases

A test case has a Name, Description, and **Priority** (`Low`, `Medium`,
`High`, `Critical`). Test cases display their assigned labels, step count,
and priority badge in the suite view.

Opening a test case shows its labels (add/remove via the label selector) and
its steps. Steps have an **Action** and **Expected Result**, and are
**drag-and-drop reorderable** — dropping a step commits the new order via a
bulk-reorder request immediately, no separate save step.

## Labels

The Labels tab manages a project's set of labels — a name plus a color
(nine presets or a custom color picker). Labels are assigned to test cases
from the test case page and can be used to filter/search across suites.
