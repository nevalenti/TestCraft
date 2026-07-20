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

This runs `helm upgrade --install --reuse-values` against
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

This re-applies the full chart with `--reuse-values`, so it won't disturb
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

### Restore

**Postgres** — copy the dump into the pod and restore it with `psql` (the
`pg_dump` above produces a plain SQL file, not a custom-format archive, so
`pg_restore` isn't used):

```bash
sudo k3s kubectl cp backup.sql testcraft/$(sudo k3s kubectl get pod -n testcraft -l app=postgres -o jsonpath='{.items[0].metadata.name}'):/tmp/backup.sql
sudo k3s kubectl exec -n testcraft deploy/postgres -- psql -U testcraft -d testcraft_db -f /tmp/backup.sql
```

Restoring into a database that already has data will fail on conflicting
rows/constraints — either restore into a freshly created database, or drop
and recreate `testcraft_db` first.

**MinIO** — point the `mc` client at the in-cluster service and mirror the
bucket back:

```bash
mc alias set testcraft-minio http://localhost:9000 <MINIO_ROOT_USER> <MINIO_ROOT_PASSWORD>
mc mirror ./attachments-backup testcraft-minio/testcraft-attachments
```

(`kubectl port-forward svc/minio 9000:9000 -n testcraft` first if running
this from outside the cluster.) Restoring the underlying PVC snapshot instead
works too, and doesn't require `mc`.

After restoring Postgres, restart the API so it drops any cached state:
`sudo k3s kubectl rollout restart deployment/api -n testcraft`.

## Teardown

```bash
make destroy
```

Deletes the `testcraft` namespace — including all persistent volumes. Make
sure you have backups (above) before running this against a real
deployment.
