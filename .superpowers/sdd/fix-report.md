# Fix Report — Review Findings for Conforma TableV2 Migration

**Commit:** `7f476dca`
**Branch:** `feat/conforma-violations-tablev2`

## Production Fixes

| ID | Description | Status |
|----|-------------|--------|
| P1 | Loading zero-count flash — restored `Bullseye`+`Spinner` early return while `!loaded` | ✅ |
| P2 | Error UX — use `getErrorState(error, loaded, 'Conforma results')` early-return before page shell | ✅ |
| P3 | Filtered empty state — use `<FilteredEmptyState onClearFilters={clearAll} />` | ✅ |
| P4 | Skeleton columns — pass `skeleton={<TableSkeleton columns={4} />}` | ✅ |
| P5 | a11y expand header — `<Th screenReaderText="Expand" />` in `TableHeader.tsx` | ✅ |
| P6 | a11y expandId — `expandId: \`${rowId}-expand\`` in `TableRow.tsx` | ✅ |
| P7 | Restore `row.code` in DetailSubTable — added `{row.code && <Content component="small">...}` | ✅ |
| P8 | Dead code — removed `filterResults` and its `textMatch` import from `conforma-grouping-utils.ts` | ✅ |
| P9 | Docs — added `expanded` / `onExpandedChange` rows to `docs/guidelines/table-v2.md` | ✅ |
| P10 | Lint — fixed import/order in all 3 files; merged Filter type imports; removed empty `TOOLBAR_GROUPS`; narrowed `HelpTooltipIcon` import to `~/shared/components/help-tooltip` | ✅ |
| P11 | `allExpanded` cast — handle `expanded === true` with `||` before record access | ✅ |

## Test Fixes

| ID | Description | Status |
|----|-------------|--------|
| T1 | Integration test — unmocked TableV2; mock `useVirtualization` (like GroupedTable.spec); real `aria-expanded` toggles | ✅ |
| T2 | groupBy clears expansion — expand all, switch to Component, assert all collapsed | ✅ |
| T3 | expand-all then showDuplicates — expand all, toggle switch, assert button label reflects state | ✅ |
| T4 | filterConfigs unit test — `conforma-table-config.spec.ts` exercising search (code/title/component) and status multiSelect | ✅ |
| T5 | Toolbar Select query — changed to `getByRole('option', { name: 'Component' })` | ✅ |

## Skipped (per ponytail)

- Sorting on grouped table (L2)
- AppEmptyState for noData (L3)
- Truncate length hardcoding (Low)
- Full unmocked useReactTable suite beyond what's needed for T1–T3

## Verification Evidence

```
$ yarn test -- src/components/Conforma/ConformaResultsTab src/shared/components/TableV2 --no-coverage
Test Suites: 23 passed, 23 total
Tests:       291 passed, 291 total

$ npx eslint --ext .ts,.tsx src/components/Conforma/ConformaResultsTab src/shared/components/TableV2
(no errors)

$ yarn type-checks
(exit 0, no errors)

$ yarn lint:restricted-imports
(exit 0, no errors)
```
