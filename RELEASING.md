# Releasing

TestCraft has two independent release tracks:

1. **Product release** — the api/web/docs Docker images and the Helm chart, versioned together as `vX.Y.Z`.
2. **`@testcraft/ci-reporter` package** — published to npm on its own cadence via [Changesets](https://github.com/changesets/changesets), since external CI systems pin it independently of the app version.

Pre-1.0: expect breaking changes between minor versions. Start at `v0.1.0` for the first release.

## Product release

1. Make sure `main` is green (the per-app GitHub Actions workflows only run for the paths that changed, so check the commit you're about to tag, not just "CI is green somewhere").
2. Bump `infrastructure/helm/testcraft/Chart.yaml` — both `version` (chart version) and `appVersion` (app version) — in a normal PR titled e.g. `chore: release v0.2.0`, and merge it to `main`.
3. Tag the merged commit and push the tag:
   ```bash
   git checkout main && git pull
   git tag v0.2.0
   git push origin v0.2.0
   ```
4. Pushing the tag triggers `.github/workflows/release.yml`, which:
   - Verifies every check run on the tagged commit succeeded (fails the release otherwise).
   - Retags the already-built, already-scanned `sha-<commit>` images for `testcraft-api`, `testcraft-web`, and `testcraft-docs` in GHCR as `vX.Y.Z` (no rebuild — the release is exactly the artifact CI already tested).
   - Creates a GitHub Release on the tag with auto-generated notes from the commit log.

> **Gateway is not published to GHCR yet** — `make build`/`make deploy` build it locally and load it straight into k3s. If you want gateway released the same way as api/web/docs, it needs a docker build+push job added to `.github/workflows/gateway.yml` first.

## `@testcraft/ci-reporter` release

This package is versioned independently via Changesets, scoped to `packages/ci-reporter` only (`.changeset/config.json` ignores every other workspace package).

1. When a PR changes `packages/ci-reporter`, add a changeset describing it:
   ```bash
   pnpm exec changeset add
   ```
   Pick the bump type (patch/minor/major) and write a one-line summary — this becomes the changelog entry.
2. Merge the PR. `.github/workflows/changesets.yml` opens (or updates) a `chore: version packages` PR that bumps `packages/ci-reporter/package.json` and its `CHANGELOG.md`.
3. Merge that PR. The same workflow then runs `pnpm exec changeset publish`, which publishes the new version to npm and creates the matching git tag.

**One-time setup required:** add an `NPM_TOKEN` repository secret (an npm automation token with publish rights for `@testcraft/ci-reporter`) before the first publish.

## Before the very first release

- [ ] Confirm `npm pack --dry-run` in `packages/ci-reporter` produces a working `dist/cli.js` — that's the only entry point external consumers use today (`main`/`types` point at TypeScript source for internal workspace use and aren't part of the published `files`).
- [ ] Add the `NPM_TOKEN` secret.
- [ ] Decide whether `.github/actions/testcraft` (the GitHub Action) should be pinned by consumers to the product tag (`@v0.1.0`) or get its own moving major tag (`@v1`) — not automated yet, revisit once the product API/schema is stable.
