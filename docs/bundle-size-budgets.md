# Bundle Size Budgets

Production bundle sizes are enforced in CI via [size-limit](https://github.com/ai/size-limit). PRs fail the **Bundle size comparison** job when **total gzip size across all configured chunks** grows by more than **2 kB** compared to the pull request **base branch** (`main` at `pull_request.base.sha`). Per-chunk lines in CI are a breakdown only; a shrink in one chunk can offset growth in another.

## How it works

1. CI checks out the **PR head**, runs `yarn build`, and records gzip sizes with `yarn size-limit --json`.
2. CI checks out the **base commit**, builds again, and records the same measurements.
3. [`.github/scripts/compare-bundle-delta.mjs`](../.github/scripts/compare-bundle-delta.mjs) sums gzip sizes across chunks on base vs PR; total growth above **2048 bytes** fails the job.
4. Chunk paths and names are defined in [`.size-limit.json`](../.size-limit.json) (measurement only — no absolute per-chunk ceilings).

## Measured chunks

| Chunk            | What it covers                                              |
| ---------------- | ----------------------------------------------------------- |
| main             | Application entry chunk (`dist/main.*.js`)                  |
| vendor           | Shared `node_modules` chunk (`dist/vendor.*.js`)            |
| route-chunks     | Combined gzip size of all lazy-loaded per-route async chunks |
| main-css         | Application styles (`dist/main.css`)                        |
| patternfly-css   | PatternFly styles (`dist/patternfly.css`)                   |
| monaco-css       | Monaco editor styles (`dist/monaco.css`, async)             |
| route-chunks-css | Combined gzip size of lazy-loaded route CSS chunks          |

The `route-chunks` entry covers named route chunks (via `webpackChunkName`) and unnamed numeric async chunks (e.g. `214.*.js`). The `route-chunks-css` entry covers per-route CSS extracted alongside those async chunks (e.g. `405.css`).

## Local verification

Compare two builds manually using a **clean `dist/`** for each side ( `dist/` is gitignored, so checking out `main` without deleting it reuses the previous branch’s artifacts and produces bogus deltas):

```bash
cp .size-limit.json /tmp/size-limit.json

# PR branch
rm -rf dist
yarn build
yarn size-limit --config /tmp/size-limit.json --json > /tmp/pr-size-limit.json

# Base branch (same machine)
git fetch origin main
git checkout origin/main
yarn install --immutable
rm -rf dist
yarn build
yarn size-limit --config /tmp/size-limit.json --json > /tmp/base-size-limit.json

git checkout -  # return to your branch
node .github/scripts/compare-bundle-delta.mjs /tmp/base-size-limit.json /tmp/pr-size-limit.json
```

To inspect what contributes to bundle size:

```bash
yarn analyze          # source-map-explorer
yarn analyze:webpack  # webpack-bundle-analyzer
```

## Intentional large growth

If a change must add more than 2 kB gzip **in total** in a single PR, coordinate with maintainers (split the work across PRs or agree on a one-off exception). There is no `.size-limit.json` ceiling to bump — the gate is relative to base only.
