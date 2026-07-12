---
title: Settings & Access
description: API tokens, notifications, project members, and your account.
sidebar:
  order: 5
---

:::note
The sidebar's global **Settings** page is currently a placeholder — everything
below is configured per-project, via the gear icon on a project's page.
:::

## Roles

There are only two tiers: the **owner** (whoever created the project) and
**members** (everyone else invited to it). Both can read and edit
everything inside the project — suites, cases, runs, results, plans,
tokens, notifications. Only the owner can invite/remove members or delete
the project itself; there's no finer-grained permission model.

## Project settings

A project's gear icon opens a settings modal with three tabs (**Members**
only appears if you own the project):

### API tokens

Create a token with a Name and optional expiry date. The token value is
shown once — copy it immediately. The list shows created/last-used/expiry
dates and lets you revoke a token. Use these for CI service accounts and
other machine-to-machine access — see
[CI Integration](/docs/guides/ci-integration/).

### Notifications

Two independent notification channels, each with its own event checkboxes
(`RunCompleted`, `FailureThresholdExceeded`):

- **Webhooks** — a URL plus an optional secret. When a secret is set, the
  API signs the outbound JSON body and sends it as
  `X-Signature: sha256=<hex>`, computed as `HMAC-SHA256(secret, raw_body)`.
  Verify it against the _raw_ request body before parsing JSON — re-serializing
  will change the bytes and break the signature. A delivery that isn't a 2xx
  response (or times out) is logged and dropped, not retried, so treat
  webhooks as best-effort, not guaranteed delivery.
- **Email subscriptions** — an email address to notify.

Example payload for `run.completed`:

```json
{
  "event_type": "run.completed",
  "run_id": "b3f1...",
  "run_name": "#42 api (main)",
  "project_id": "9c2e..."
}
```

`run.threshold_breached` adds a `fail_rate` field (0–1). See
[Troubleshooting](/docs/guides/troubleshooting/#webhooks-arent-firing-or-the-signature-doesnt-verify)
if deliveries aren't showing up.

### Members

Invite collaborators by email; the list shows display name, email, and date
added, with a remove action. Owner-only.

## Your account

The Account page (avatar menu) shows:

- **Avatar** — click to upload a JPEG/PNG/WEBP/GIF.
- **Profile fields** — First Name, Last Name, Username, Email, sourced from
  Keycloak and read-only in TestCraft itself.
- **Manage account** — opens Keycloak's own account console in a new tab,
  where profile/password/social-login changes actually happen.
- **Sign out** — with a confirmation dialog.
