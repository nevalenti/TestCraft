---
title: Security Hardening
description: Checklist for locking down a production TestCraft deployment.
sidebar:
  order: 7
---

None of this is enforced by the chart — apply it before exposing a
deployment to the internet.

## Password policy

Keycloak's `testcraft` realm enforces `length(12) and notUsername and
notEmail and passwordHistory(3) and hashIterations(210000)` (`passwordPolicy`
in `infrastructure/helm/testcraft/files/keycloak/realm.json`).

## TLS

`tls.provider` in `infrastructure/helm/testcraft/values.yaml`:

- `letsencrypt` — cert-manager ACME HTTP-01; requires `tls.acmeEmail` and
  real, publicly resolvable `tls.dnsNames`. Use this for anything public.
- anything else — self-signed internal CA. Don't ship this to real users.

## Secrets

`infrastructure/helm/testcraft/values.secrets.yaml` holds every credential
and is gitignored — never commit it. To rotate: change a value, then re-run
`just deploy-prod` (or `just deploy-app`). The self-hosted GitHub Actions
runner keeps its own copy outside the checked-out workspace — update that
copy too, or the next auto-deploy restores the old secrets.

## Keycloak admin console

The Gateway routes all of `auth.testcraft.pro`, including `/admin`, straight
to Keycloak — there's no separate network boundary around it. Mitigate with
a strong `KEYCLOAK_ADMIN_PASSWORD`, an IP allowlist/VPN, or a `NetworkPolicy`
restricting access to the Keycloak service.

## API surface

- `CORS_ALLOWED_ORIGINS` is empty by default in production — don't set it to `*`.
- Set `SWAGGER_BASIC_AUTH_USERNAME`/`PASSWORD` to gate `/api/docs`.
- Set `HANGFIRE_BASIC_AUTH_USERNAME`/`PASSWORD` to gate the Hangfire dashboard.
- Set `METRICS_TOKEN` to gate `/api/metrics`, unless scraping is already restricted to in-cluster traffic.
- API tokens are hashed at rest and shown in full only once — a lost token needs revocation and reissue, not recovery.

See [Environment Variables](/docs/reference/environment-variables/) for where
each of these is set.
