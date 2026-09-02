# Bundle Size Budgets

Production bundle sizes are enforced in CI via [size-limit](https://github.com/ai/size-limit). PRs that exceed a budget fail the `size-limit` check in the **UI Lint & Unit Tests** workflow.

## How it works

1. CI runs `yarn build` to produce the production webpack output in `dist/`.
2. `yarn size-limit` measures each configured chunk against the limits in [`.size-limit.json`](../.size-limit.json).
3. Limits use **gzip-compressed** size, which reflects transfer cost more accurately than raw byte size.

## Budget thresholds

Limits include ~10–15% headroom above current sizes so routine changes do not fail CI. Increase a limit only when the size growth is intentional (e.g. a new dependency or feature).

| Chunk         | Gzip limit | What it covers                                              |
| ------------- | ---------- | ----------------------------------------------------------- |
| main          | 275 kB     | Application entry chunk (`dist/main.*.js`)                  |
| vendor        | 650 kB     | Shared `node_modules` chunk (`dist/vendor.*.js`)            |
| route-chunks  | 40 kB      | Combined gzip size of all lazy-loaded per-route async chunks |

The `route-chunks` entry covers named route chunks (via `webpackChunkName`) and unnamed numeric async chunks (e.g. `214.*.js`).

## Local verification

```bash
yarn build
yarn size-limit
```

To inspect what contributes to bundle size manually:

```bash
yarn analyze          # source-map-explorer
yarn analyze:webpack  # webpack-bundle-analyzer
```

## Updating budgets

When a chunk legitimately grows beyond its limit:

1. Run `yarn build && yarn size-limit` locally to confirm the new size.
2. Update the corresponding `limit` in `.size-limit.json`.
3. Update the table in this document.
4. Explain the size increase in the PR description.
