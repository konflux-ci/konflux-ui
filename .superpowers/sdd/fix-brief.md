# Fix brief — consolidated review findings

Worktree: `/Users/oamsalem/projects/konflux-ci/konflux-ui/.worktrees/feat-conforma-violations-tablev2`
Branch: `feat/conforma-violations-tablev2`

Reviews: `.superpowers/sdd/review-qa.md`, `review-ux.md`, `review-fullsend.md`

## Must fix (production)

### P1 — Loading zero-count flash (UX H1)
`ConformaResultsTab.tsx`: Restore early return while `!loaded` with `Bullseye`+`Spinner` (aria-label "Loading Conforma results") — do NOT render title/summary/toolbar until loaded. Matches upstream/main and avoids flashing "0 Violations".

### P2 — Error UX (UX H2 + Fullsend F1)
Use `getErrorState(error, loaded, 'Conforma results')` early-return BEFORE page shell. Remove `loadError` from `TableContainer`. Do not use `error instanceof Error` narrowing that swallows non-Error shapes.

### P3 — Filtered empty (UX M1)
Use `<FilteredEmptyState onClearFilters={clearAll} />` from `~/shared/components/empty-state/FilteredEmptyState`. Destructure `clearAll` from `useFilterState(filterConfigs)`.

### P4 — Skeleton columns (UX M4)
Pass `skeleton={<TableSkeleton columns={4} />}` to `TableContainer` (import from TableV2).

### P5 — a11y expand header (UX M2)
In `src/shared/components/TableV2/TableHeader.tsx`, when `enableExpansion`, use `<Th screenReaderText="Expand" />` (or equivalent PF prop).

### P6 — a11y expandId (UX M3)
In `src/shared/components/TableV2/TableRow.tsx`, pass `expandId: \`${rowId}-expand\`` into the expand config.

### P7 — Restore `row.code` in DetailSubTable (regression)
`ConformaGroupedTable.tsx` DetailSubTable dropped `{row.code && <Content component="small">{row.code}</Content>}`. Restore under the title (as on upstream/main).

### P8 — Dead code (Fullsend F2)
Remove unused `filterResults` from `conforma-grouping-utils.ts` and its `textMatch` import if unused. Update/remove tests that only cover `filterResults`.

### P9 — Docs (Fullsend F3)
Add `expanded` / `onExpandedChange` rows to props table in `docs/guidelines/table-v2.md`.

### P10 — Lint
Fix import/order and import/no-duplicates in:
- ConformaResultsTab.tsx
- ConformaResultsToolbar.tsx (merge Filter imports)
- conforma-table-config.tsx

Also: remove empty `TOOLBAR_GROUPS` if `groups` prop is optional; import HelpTooltipIcon from a narrower path if possible (avoid `~/shared` barrel pulling topology in tests) — only if easy.

### P11 — allExpanded cast (UX L1, cheap)
Handle `expanded === true` in `allExpanded` computation.

## Must fix (tests — QA Critical/High)

### T1 — Integration coverage without mocking TableV2
Add or refactor so at least one `ConformaResultsTab` test (or new integration spec) renders with REAL `Table` + `TableContainer` (may still mock `useApplicationConformaResults` and Filter if needed, but prefer real Filter + Nuqs). Assert:
- loading shows spinner and does NOT show summary bar counts (after P1)
- error uses getErrorState messaging ("Unable to load Conforma results")
- Expand all drives real `aria-expanded` toggles

If keeping heavily mocked wiring tests, re-scope them clearly; do not leave Expand-all only covered by a fake Table.

Mock `useVirtualization` to return all rows (as ConformaGroupedTable.spec already does) so JSDOM renders expand buttons.

### T2 — groupBy clears expansion
With real Table: expand a group, switch group-by to Component, assert detail content collapsed / expanded cleared.

### T3 — expand-all then showDuplicates
Click Expand all, toggle show multi-arch duplicates, assert Expand/Collapse all button label reflects `allExpanded` correctly.

### T4 — filterConfigs unit test
Small `conforma-table-config.spec.ts` (or add to grouping-utils specs) exercising search filterFn (code/title/component) and status multiSelect filterFn.

### T5 — Toolbar Select query
Use `getByRole('option', { name: 'Component' })` instead of bare `getByText('Component')`.

## Skip (ponytail)
- Sorting on grouped table (L2)
- AppEmptyState for noData (L3)
- Truncate length hardcoding (Low)
- Full unmocked useReactTable suite beyond what's needed for T1–T3

## Verification (must all pass)
```bash
yarn test -- src/components/Conforma/ConformaResultsTab src/shared/components/TableV2
npx eslint --ext .ts,.tsx src/components/Conforma/ConformaResultsTab src/shared/components/TableV2
yarn type-checks
yarn lint:restricted-imports
```

Also check package.json for how CI runs lint — if `yarn lint` needs e2e deps, document; prefer fixing so `yarn lint` works if feasible (e.g. yarn install in e2e-tests).

## Commit
One commit preferred: `fix: address review findings for Conforma TableV2 migration`
Use `git commit -s` with `Assisted-by: Claude` trailer. Do NOT push. Never update git config.

## Report
Write `.superpowers/sdd/fix-report.md` with what was fixed, skipped, and verification output.
