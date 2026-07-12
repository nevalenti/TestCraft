---
title: Production Deployment
description: Deploy TestCraft to a k3s cluster with Helm.
sidebar:
  order: 4
---

TestCraft ships as a Helm chart at `infrastructure/helm/testcraft`, deployed
to [k3s](https://k3s.io). Every service — API, web, Gateway, Keycloak,
Postgres, Redis, RabbitMQ, MinIO, Grafana, Prometheus, Loki, Seq, and the
docs site — runs in-cluster behind a single YARP reverse proxy (the
Gateway), so the whole app is reachable from one domain.

## Prerequisites

- A running k3s cluster (`sudo k3s kubectl` and `sudo helm` must work)
- [mkcert](https://github.com/FiloSottile/mkcert) for local/internal TLS
  certificates
- Docker, to build and load images into k3s's containerd

## Configure secrets

Copy the example and fill it in — this file is gitignored and must never be
committed:

```bash
cp infrastructure/helm/testcraft/values.secrets.yaml.example \
   infrastructure/helm/testcraft/values.secrets.yaml
```

It holds credentials for Postgres, RabbitMQ, MinIO, Grafana, Keycloak, and
OAuth client secrets (GitHub/Google social login) — see
`infrastructure/helm/testcraft/values.yaml` for the full set of tunables
(image tags, PVC sizes, TLS DNS names).

## Deploy

```bash
make deploy
```

This builds the `api`, `web`, `gateway`, and `docs` Docker images, imports
them into k3s's containerd via `k3s ctr images import`, then runs
`helm upgrade --install` and does a rolling restart of every Deployment. Check
progress at any time with:

```bash
make status
```

## Routing

Every path below `/` is proxied by the Gateway
(`apps/Gateway/src/TestCraft.Gateway/appsettings.json`) to an internal
service — nothing but the Gateway is exposed outside the cluster:

| Path         | Destination                    |
| ------------ | ------------------------------ |
| `/api/*`     | API                            |
| `/hubs/*`    | API (SignalR)                  |
| `/`          | Web SPA                        |
| `/docs/*`    | Documentation site (this site) |
| `/grafana/*` | Grafana                        |
| `/seq/*`     | Seq                            |
| `/storage/*` | MinIO                          |
| `:8443`      | Keycloak (separate HTTPS port) |

When adding a new service behind the Gateway, follow the existing pattern:
a `PathRemovePrefix` transform strips the route prefix before forwarding, so
the downstream app (or its base-path config, e.g. Seq's `BASE_URI_PATH`)
must agree with the same prefix the Gateway route matches on.

## Backups

There's no built-in backup automation — persistent state lives in PVCs
(`infrastructure/helm/testcraft/templates/postgres.yaml`,
`minio.yaml`, sized via `values.yaml`'s `storage.*` keys) and is your
responsibility to snapshot. At minimum, back up:

- **Postgres** — the source of truth for everything except file
  attachments: `sudo k3s kubectl exec -n testcraft deploy/postgres -- pg_dump -U testcraft testcraft_db > backup.sql`
- **MinIO** — test result attachments (screenshots, logs): mirror the
  `testcraft-attachments` bucket with the `mc` client, or snapshot the
  underlying PVC.

Losing Keycloak's PVC loses realm/user config, but that's reproducible from
`infrastructure/keycloak/realm.json` — it doesn't need routine backups.

## Teardown

```bash
make destroy
```

Deletes the `testcraft` namespace — including all persistent volumes. Make
sure you have backups (above) before running this against a real
deployment.
