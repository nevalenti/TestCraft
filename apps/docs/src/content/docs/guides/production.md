---
title: Production Deployment
description: Deploy TestCraft to a k3s cluster with Helm.
sidebar:
  order: 5
---

TestCraft ships as a Helm chart at `infrastructure/helm/testcraft`, deployed
to [k3s](https://k3s.io) behind a single YARP reverse proxy (the Gateway),
so the whole app is reachable from one domain.

## Prerequisites

- A running k3s cluster (`sudo k3s kubectl` and `sudo helm` must work)
- [`just`](https://github.com/casey/just)

## Deploy

```bash
cp infrastructure/helm/testcraft/values.secrets.yaml.example \
   infrastructure/helm/testcraft/values.secrets.yaml
# fill in credentials — gitignored, never commit it

just deploy-app api sha-<full-commit-sha-or-version>
```

Each service is pinned to an explicit image tag, so `helm rollback` actually
reverts the image. This restarts only that service; a failed rollout
auto-rolls back. For chart/config changes not tied to one app's image (PVC
sizes, ingress, dashboards): `just deploy-prod`. Check progress with
`just status`.

Pushing to `main` deploys automatically per app; `infrastructure/helm/**`
changes deploy via `just deploy-prod`. To deploy a specific released version
on demand, run `.github/workflows/deploy-version.yml` manually.

## Routing

| Path                          | Destination                     |
| ------------------------------ | --------------------------------- |
| `/api/*`, `/hubs/*`            | API (incl. SignalR)              |
| `/`                             | Web SPA                          |
| `/docs/*`                       | This site                        |
| `/grafana/*`, `/seq/*`         | Grafana, Seq                     |
| `/storage/*`, `/testcraft/*`   | MinIO                            |

Keycloak is routed by Host header instead: `auth.testcraft.pro` → Keycloak.

Adding a new service: a `PathRemovePrefix` transform strips the route prefix
before forwarding, so the downstream app's base-path config must match.

## Backups

Three daily CronJobs back up to the `minio` bucket (retained 14 days):
`postgres-backup`, `minio-backup` (mirrors attachments), and
`postgres-restore-verify` (restores the latest dump into a scratch DB to
catch corrupt backups early). All alert to email on failure.

Not offsite by default — enable `backups.offsite.*` in `values.yaml` to
mirror to an external S3-compatible endpoint. Keycloak's PVC doesn't need
backups; it's reproducible from `realm.json`.

**Restore Postgres**:

```bash
kubectl port-forward svc/minio 9000:9000 -n testcraft &
mc alias set testcraft-minio http://localhost:9000 <MINIO_ROOT_USER> <MINIO_ROOT_PASSWORD>
mc cp testcraft-minio/testcraft-backups/postgres/testcraft_db-<timestamp>.dump ./backup.dump

sudo k3s kubectl cp backup.dump testcraft/$(sudo k3s kubectl get pod -n testcraft -l app=postgres -o jsonpath='{.items[0].metadata.name}'):/tmp/backup.dump
sudo k3s kubectl exec -n testcraft deploy/postgres -- pg_restore -U testcraft -d testcraft_db --clean --if-exists /tmp/backup.dump
sudo k3s kubectl rollout restart deployment/api -n testcraft
```

Same steps with `keycloak_db-<timestamp>.dump` and `-d keycloak_db` restore
Keycloak instead. **Restore MinIO**:
`mc mirror testcraft-minio/testcraft-backups/attachments/ testcraft-minio/testcraft-attachments/`.

## Teardown

`just destroy` deletes the `testcraft` namespace, including all persistent
volumes. Back up first.

## Upgrading

Every push to `main` builds and deploys a `:<commit-sha>` image per app —
production tracks `main` at the commit level. Pushing a `v1.2.3` git tag
promotes that image to `:v1.2.3` and cuts a
[GitHub Release](https://github.com/nevalenti/TestCraft/releases). Deploy or
roll back to a specific version with `just deploy-app api v1.2.3`.

EF Core migrations apply automatically on API startup when
`APPLY_MIGRATIONS=true` — no separate manual migration step.

`testcraft-ci-reporter` (the npm package under `packages/ci-reporter`) is
versioned and released independently of the app images, via
[Changesets](https://github.com/changesets/changesets).
