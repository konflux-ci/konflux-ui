# Task 1 Report — Controlled expansion for TableV2

## Status
DONE

## Files changed
- `src/shared/components/TableV2/hooks/useTable.ts` — added `expanded?: ExpandedState` / `onExpandedChange?: OnChangeFn<ExpandedState>` to `UseTableOptions`; wired into `useReactTable` (`state.expanded` when `expanded !== undefined` and `enableExpansion`, `onExpandedChange` when provided). Uncontrolled behavior preserved when both are omitted.
- `src/shared/components/TableV2/types.ts` — added `expanded` / `onExpandedChange` to `TableProps`.
- `src/shared/components/TableV2/Table.tsx` — destructures and forwards `expanded` / `onExpandedChange` to `useTable`.
- `src/shared/components/TableV2/index.ts` — re-exports `ExpandedState` and `OnChangeFn` from `@tanstack/react-table`.
- `src/shared/components/TableV2/__tests__/useTable.spec.ts` — added tests: controlled `expanded` state passed into `state.expanded`, `onExpandedChange` wired through, and both omitted in uncontrolled mode.
- `src/shared/components/TableV2/__tests__/Table.spec.tsx` — added test asserting `expanded`/`onExpandedChange` are forwarded from `Table` to `useTable`.

## Commit
`4f9cf858b3da3713bd33ec5e156f3f81a4660377`

## Test command + result
- `yarn test -- src/shared/components/TableV2` → 14 suites / 142 tests passed
- `yarn eslint <changed files>` → clean
- `yarn type-checks` → clean

## Concerns
None. Change is fully backward-compatible; existing uncontrolled expansion stories/tests are unaffected (verified via full TableV2 test run).
