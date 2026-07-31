---
title: Production Deployment
description: Deploy TestCraft to a k3s cluster with Helm.
sidebar:
  order: 5
---

TestCraft ships as a Helm chart at `infrastructure/helm/testcraft`, deployed
to [k3s](https://k3s.io). Every service — API, web, Gateway, Keycloak,
Postgres, Redis, RabbitMQ, MinIO, Grafana, Prometheus, Loki, Seq, and the
docs site — runs in-cluster behind a single YARP reverse proxy (the
Gateway), so the whole app is reachable from one domain.

## Prerequisites

- A running k3s cluster (`sudo k3s kubectl` and `sudo helm` must work)
- [mkcert](https://github.com/FiloSottile/mkcert) for local/internal TLS
  certificates (only needed for `make deploy`, not production)
- Docker, only needed for `make deploy`'s local image build — production
  pulls prebuilt images from GHCR instead

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

Each service is pinned to an explicit, immutable image tag (a commit SHA or a
released version like `v1.2.3`) rather than `:latest`, so a Helm revision
always records exactly what's running and `helm rollback` actually reverts
the image, not just the chart. Deploy one service at a time:

```bash
make deploy-app APP=api TAG=<sha-or-version>
```

This runs `helm upgrade --install --reset-then-reuse-values` against
`values.production.yaml`/`values.secrets.yaml`, overriding only
`images.<app>.tag`, then restarts and waits on that one Deployment. Every
other service keeps whatever tag it was last deployed with. If the rollout
doesn't become healthy within the timeout, it automatically runs
`helm rollback` to undo it.

For chart/template/config changes that aren't tied to a specific app image
(PVC sizes, ingress, dashboards, initial bootstrap, disaster recovery), use:

```bash
make deploy-prod
```

This re-applies the full chart with `--reset-then-reuse-values`, so it won't disturb
any app's currently pinned tag. Check progress at any time with:

```bash
make status
```

For a local/internal cluster instead of production — mkcert TLS, images
built and imported from source rather than pulled from GHCR — use
`make deploy` instead.

## Continuous deployment

Pushing to `main` deploys automatically: the `api`/`web`/`gateway`/`docs`
GitHub Actions workflows each build and push a `:<commit-sha>` image to GHCR,
then, in the same workflow, run `make deploy-app APP=<app> TAG=<sha>` on a
self-hosted runner registered on the production box — only that one service
restarts, and only after its own tests and image push succeeded. Changes
under `infrastructure/helm/**` are deployed by `.github/workflows/infra.yml`,
which runs `make deploy-prod`. To (re)deploy a specific released version on
demand, run `.github/workflows/deploy-version.yml` manually and pick the app
and version tag.

The runner needs Docker-free access to `k3s kubectl` and `helm` (matching the
`KUBECTL`/`HELM` variables in the `Makefile`), and its workspace must keep
`infrastructure/helm/testcraft/values.secrets.yaml` in place between runs —
it's gitignored and never checked out from the repo.

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

Keycloak is routed separately, by Host header rather than path: requests to
`auth.testcraft.pro` go to Keycloak instead of the Web SPA.

When adding a new service behind the Gateway, follow the existing pattern:
a `PathRemovePrefix` transform strips the route prefix before forwarding, so
the downstream app (or its base-path config, e.g. Seq's `BASE_URI_PATH`)
must agree with the same prefix the Gateway route matches on.

## Backups

Backups are automated via three CronJobs in the chart, scheduled by
`values.yaml`'s `backups.*` keys and landing in the `minio` bucket named by
`backups.minioBucket` (default `testcraft-backups`), retained for
`backups.retentionDays` (default 14 days):

- **`postgres-backup`** (`backups.postgresSchedule`, default `0 3 * * *`) —
  dumps both `testcraft_db` and `keycloak_db` with `pg_dump -Fc` (custom
  format), uploads them to `<bucket>/postgres/`.
- **`minio-backup`** (`backups.minioSchedule`, default `15 3 * * *`) —
  mirrors the attachments bucket to `<bucket>/attachments/`.
- **`postgres-restore-verify`** (`backups.restoreVerifySchedule`, default
  `30 3 * * *`) — downloads the latest Postgres dumps, restores each into a
  scratch database, and checks it actually contains tables. A backup job
  exiting `0` doesn't guarantee the dump is usable; this catches a
  corrupt or empty dump that would otherwise go unnoticed until an actual
  restore was needed.

All three are on their own alert rules (`infrastructure/helm/testcraft/files/prometheus/alert-rules.yml`)
routed through Alertmanager to email — a failed job, a job that stops
running entirely, or a dump that fails to restore all page.

These backups are **not offsite** — they live in the same cluster's MinIO,
so a full loss of the box takes the backups with it. If you need real
disaster-recovery coverage, mirror the bucket to storage outside this host.

Losing Keycloak's PVC loses realm/user config, but that's reproducible from
`infrastructure/helm/testcraft/files/keycloak/realm.json` — it doesn't need routine
backups.

### Restore

**Postgres** — download the dump from MinIO and restore with `pg_restore`
(the backup is a custom-format archive, not a plain SQL file):

```bash
kubectl port-forward svc/minio 9000:9000 -n testcraft &
mc alias set testcraft-minio http://localhost:9000 <MINIO_ROOT_USER> <MINIO_ROOT_PASSWORD>
mc cp testcraft-minio/testcraft-backups/postgres/testcraft_db-<timestamp>.dump ./backup.dump

sudo k3s kubectl cp backup.dump testcraft/$(sudo k3s kubectl get pod -n testcraft -l app=postgres -o jsonpath='{.items[0].metadata.name}'):/tmp/backup.dump
sudo k3s kubectl exec -n testcraft deploy/postgres -- pg_restore -U testcraft -d testcraft_db --clean --if-exists /tmp/backup.dump
```

Use the same steps with `keycloak_db-<timestamp>.dump` and `-d keycloak_db`
to restore Keycloak's database instead.

**MinIO** — mirror the attachments bucket back:

```bash
mc mirror testcraft-minio/testcraft-backups/attachments/ testcraft-minio/testcraft-attachments/
```

Restoring the underlying PVC snapshot instead works too, and doesn't require
`mc`.

After restoring Postgres, restart the API so it drops any cached state:
`sudo k3s kubectl rollout restart deployment/api -n testcraft`.

## Teardown

```bash
make destroy
```

Deletes the `testcraft` namespace — including all persistent volumes. Make
sure you have backups (above) before running this against a real
deployment.
