# Bundle Size Budgets

Production bundle sizes are enforced in CI via [size-limit](https://github.com/ai/size-limit). A PR fails the **Bundle size comparison** job when either gate fails:

- a chunk's gzip size is over its `limit` in [`.size-limit.json`](../.size-limit.json)
- **total** gzip size across all chunks grows by more than **2 kB** versus the pull request base (`pull_request.base.sha`)

A shrink in one chunk can still offset growth in another inside that 2 kB total. The per-chunk limits are what stop a chunk from growing without a ceiling.

## How it works

1. CI checks out the **PR merge commit** (`refs/pull/<n>/merge` for `pull_request`; `merge_group.head_sha` for merge queue) and reads its `.size-limit.json`.
2. CI reads `.size-limit.json` from the **base commit**. [`.github/scripts/merge-size-limit-config.mjs`](../.github/scripts/merge-size-limit-config.mjs) writes one comparison config: path patterns for the same check name are combined, and a check that exists on base is kept even if the PR drops it. A `limit` set in the PR is used; if the PR omits `limit`, the base limit is used.
3. CI builds the PR and the base with that **same** config at the repo root (`.size-limit.ci.json`). `size-limit --json` is kept even when size-limit exits non-zero, so a ceiling failure is not lost.
4. [`.github/scripts/compare-bundle-delta.mjs`](../.github/scripts/compare-bundle-delta.mjs) fails the job when an expected check is missing, removed, renamed, or duplicated, when a PR chunk is over its ceiling, or when total growth is above **2048 bytes**. Both failures are in the same report.

## Measured chunks

| Chunk            | Gzip limit | What it covers                                              |
| ---------------- | ---------- | ----------------------------------------------------------- |
| main             | 282 kB     | Application entry chunk (`dist/main.*.js`)                  |
| vendor           | 700 kB     | Shared `node_modules` chunk (`dist/vendor.*.js`)            |
| route-chunks     | 40 kB      | Combined gzip size of all lazy-loaded per-route async chunks |
| main-css         | 8 kB       | Application styles (`dist/main.css`)                        |
| patternfly-css   | 160 kB     | PatternFly styles (`dist/patternfly.css`)                   |
| monaco-css       | 18 kB      | Monaco editor styles (`dist/monaco.css`, async)             |
| route-chunks-css | 6 kB       | Combined gzip size of lazy-loaded route CSS chunks          |

The `route-chunks` entry covers named route chunks (via `webpackChunkName`) and unnamed numeric async chunks (e.g. `214.*.js`). The `route-chunks-css` entry covers per-route CSS extracted alongside those async chunks (e.g. `405.css`).

## Local verification

Compare two builds manually using a **clean `dist/`** for each side ( `dist/` is gitignored, so checking out `main` without deleting it reuses the previous branch’s artifacts and produces bogus deltas):

Size Limit resolves `path` globs relative to the config file. Keep that file at the repository root so it measures this repo's `dist/`, not `/tmp/dist`.

```bash
cp .size-limit.json /tmp/size-limit.pr.json
git fetch origin main
git show origin/main:.size-limit.json > /tmp/size-limit.base.json
node .github/scripts/merge-size-limit-config.mjs /tmp/size-limit.base.json /tmp/size-limit.pr.json .size-limit.local.json

# PR branch
rm -rf dist
yarn build
yarn size-limit --config .size-limit.local.json --json > /tmp/pr-size-limit.json

# Base branch (same machine). Keep .size-limit.local.json at the repo root.
git checkout origin/main
yarn install --immutable
rm -rf dist
yarn build
yarn size-limit --config .size-limit.local.json --json > /tmp/base-size-limit.json

git checkout -
node .github/scripts/compare-bundle-delta.mjs /tmp/base-size-limit.json /tmp/pr-size-limit.json \
  --config .size-limit.local.json \
  --base-config /tmp/size-limit.base.json \
  --pr-config /tmp/size-limit.pr.json
```

To inspect what contributes to bundle size:

```bash
yarn analyze          # source-map-explorer
yarn analyze:webpack  # webpack-bundle-analyzer
```

## Exceptions

Both gates still run. Changing one does not turn off the other.

- **Chunk ceiling:** raise that check's `limit` in `.size-limit.json` and explain the new size in the PR description. CI uses the PR's `limit` when it is set. Deleting `limit` does not remove the ceiling; the base limit is used instead. Removing or renaming a check fails the job.
- **2 kB total growth:** split the change across PRs, or change `BUNDLE_MAX_GROWTH_BYTES` in [`.github/workflows/main.yaml`](../.github/workflows/main.yaml) in this PR so the waiver is visible in review.
