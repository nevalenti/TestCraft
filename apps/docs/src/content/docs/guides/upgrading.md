---
title: Upgrading
description: How production images are versioned and what changed between releases.
sidebar:
  order: 8
---

## App images

The API, web, Gateway, and docs images are versioned independently of each
other, by tag:

- Every push to `main` builds and deploys a `:<commit-sha>` image per app —
  see [Continuous deployment](/docs/guides/production/#continuous-deployment).
  There's no fixed "app version" day to day; production tracks `main` at the
  commit level.
- Pushing a `v1.2.3` git tag (`.github/workflows/release.yml`) promotes each
  app's current `:latest` GHCR image to `:v1.2.3` and creates a
  [GitHub Release](https://github.com/nevalenti/TestCraft/releases) with
  auto-generated notes (`gh release create --generate-notes`, i.e. the merged
  PR titles since the previous tag).

Check the [Releases page](https://github.com/nevalenti/TestCraft/releases)
before pinning production to a specific version, to see what changed. To
deploy a specific released version (or roll back to one) instead of riding
`main`, run `.github/workflows/deploy-version.yml` manually and pick the app
and tag, or:

```bash
just deploy-app api v1.2.3
```

## Database migrations

EF Core migrations apply automatically on API startup when
`APPLY_MIGRATIONS=true` (see
[Environment Variables](/docs/reference/environment-variables/)) — there's
no separate manual migration step to run before/after bumping the API's
image tag. A release's GitHub Release notes will mention new migrations if
the PR that added them did.

## `testcraft-ci-reporter`

The npm package under `packages/ci-reporter` is versioned and published
separately from the app images, via [Changesets](https://github.com/changesets/changesets)
(`.changeset/config.json`, `.github/workflows/changesets.yml`) — it follows
its own `0.x` version on npm, unrelated to the `vX.Y.Z` app release tags
above.
