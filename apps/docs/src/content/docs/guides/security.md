---
title: Security Hardening
description: Checklist for locking down a production TestCraft deployment.
sidebar:
  order: 7
---

None of this is enforced by the chart — it's on you to apply before exposing
a deployment to the internet.

## Password policy

Keycloak's `testcraft` realm enforces a minimum-length password policy
(`passwordPolicy` in `infrastructure/keycloak/realm.json` /
`infrastructure/helm/testcraft/files/realm.json`, currently
`length(12) and notUsername and notEmail and passwordHistory(3) and hashIterations(210000)`).
Both copies must be kept in sync manually — there's no templating link
between the local-dev file and the Helm-deployed one.

## TLS

`tls.provider` in `infrastructure/helm/testcraft/values.yaml` controls how the
Gateway's certificate is issued (`infrastructure/helm/testcraft/templates/certificate.yaml`):

- `letsencrypt` — a cert-manager `ClusterIssuer` using the ACME HTTP-01
  solver against `nginx-acme`; requires `tls.acmeEmail` and real, publicly
  resolvable `tls.dnsNames`.
- anything else — a self-signed internal CA (`testcraft-ca-issuer`), which is
  what `make deploy`'s mkcert-based local/internal flow uses.

Use `letsencrypt` for any deployment reachable from the public internet —
don't ship the internal CA to real users.

## Secrets

`infrastructure/helm/testcraft/values.secrets.yaml` holds every credential
(Postgres, RabbitMQ, MinIO, Grafana, Keycloak admin, OAuth client secrets)
and is gitignored — it must never be committed. Rotate it like any other
credential store:

- Change a value, then re-run `make deploy-prod` (or `make deploy-app`) to
  roll it out — neither command touches image tags, so this is safe to run
  on its own.
- The self-hosted GitHub Actions runner keeps its own copy of
  `values.secrets.yaml` outside the checked-out workspace (see
  [Production Deployment](/docs/guides/production/#continuous-deployment));
  update that copy too, or the next automatic deploy will silently restore
  the old secrets.

## Keycloak admin console

The Gateway routes all of `auth.testcraft.pro` (the full path, including
`/admin`) straight to Keycloak — there's no separate network boundary around
the admin console. Anyone who reaches your domain can reach the login page
for it. Mitigate with whatever's available in your environment: a strong,
unique `KEYCLOAK_ADMIN_PASSWORD`, an IP allowlist or VPN in front of the
cluster, or a `NetworkPolicy` restricting who can resolve/reach the Keycloak
service directly.

## API surface

- `CORS_ALLOWED_ORIGINS` is empty by default — the API accepts no
  cross-origin requests until you explicitly list your web app's origin(s).
  Don't set it to `*` in production.
- `SWAGGER_BASIC_AUTH_USERNAME` / `SWAGGER_BASIC_AUTH_PASSWORD` gate
  `/api/docs` (Swagger UI) — set both in production; local dev has no Basic
  Auth because those variables are unset.
- `METRICS_TOKEN` gates `/api/metrics` — set it if Prometheus scraping isn't
  restricted to in-cluster traffic already.
- API tokens (project-scoped, for CI pipelines) are hashed at rest
  (`ApiTokenHasher`) and shown in full exactly once, at creation — treat a
  lost token as needing revocation and reissue, not recovery.

See [Environment Variables](/docs/reference/environment-variables/) for
where each of these is set.
