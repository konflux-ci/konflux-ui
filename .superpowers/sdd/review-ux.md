# UX Review — Conforma Results TableV2 Migration

**Branch:** `feat/conforma-violations-tablev2` vs `upstream/main`
**Reviewer focus:** behavioral/UX regressions, accessibility, consistency with other TableV2 pages, visual/interaction quality, loading/error/empty clarity.

Commits reviewed:
- `4f9cf858` feat: add controlled expansion props to TableV2
- `86d6bee9` feat: migrate Conforma results table to TableV2
- `9d3cf24b` test: update Conforma specs for TableV2 migration

Files read in full: `ConformaResultsTab.tsx`, `ConformaGroupedTable.tsx`, `ConformaResultsToolbar.tsx`, `conforma-table-config.tsx`, `ConformaSummaryBar.tsx`, `ConformaResultsTab.scss`, plus `upstream/main` versions of the same files, and TableV2 internals (`Table.tsx`, `TableContainer.tsx`, `TableHeader.tsx`, `TableBody.tsx`, `TableRow.tsx`), and sibling TableV2 consumers (`IntegrationTestsListView.tsx`, `SnapshotsListView.tsx`) for consistency comparison.

---

## Summary

The migration to `TableV2` is functionally solid for the "happy path" (group-by, expand/collapse, expand-all, filters, show-duplicates toggle all work and are unit-tested). However, the PR silently drops two structural page-level behaviors that existed on `upstream/main` — a blocking loading spinner and a dedicated error page — replacing them with a lighter-weight, less consistent pattern that diverges from every other `TableV2` list page in the codebase (`IntegrationTestsListView`, `SnapshotsListView`). The filtered-empty state also regresses from a shared, actionable empty state to inert text. These are the driving issues behind the verdict below; the table/interaction layer itself is a clean upgrade over the old PatternFly-table implementation.

---

## Findings

### Critical

None.

### High

**H1 — Loading state now flashes misleading zero counts instead of blocking render**
*Location:* `ConformaResultsTab.tsx` (lines 91–148), vs `upstream/main` version (lines ~108–121).

On `upstream/main`, the component returns a full-page `Bullseye`+`Spinner` and renders **nothing else** (no title, no summary bar, no toolbar) while `!loaded`:

```112:121:.worktrees/feat-conforma-violations-tablev2/.git (upstream/main copy)
if (!loaded) {
  return (
    <PageSection>
      <Bullseye>
        <Spinner size="xl" aria-label="Loading Conforma results" />
      </Bullseye>
    </PageSection>
  );
}
```

On the branch, that early-return is gone. The title, description, and `ConformaSummaryBar` are now rendered unconditionally, and only the table area shows a skeleton via `TableContainer`. Since `useApplicationConformaResults` returns `totalComponents: 0`, `totalFailed: 0`, and empty result arrays before `loaded` becomes `true`, the summary bar renders **"0 Components · 0 Failed Components · 0 Violations · 0 Warnings · 0 Successes"** for the entire loading window, then pops to the real numbers once data arrives. This is confirmed by the current test (`ConformaResultsTab.spec.tsx:213-222`, "shows a spinner when data is loading") which only asserts a `progressbar` exists — it does not check that the summary bar is suppressed, and in the real (non-mocked) tree it is not.

*Impact:* Users will see a flash of "everything passed / nothing failed" before real (possibly alarming) violation counts appear — the opposite of what a security/compliance summary should communicate during a transient state.

*Fix:* Either (a) restore the pre-`loaded` early return (simplest, matches old behavior exactly), or (b) keep the new "always show shell" pattern but skeleton/hide `ConformaSummaryBar` while `!loaded` (e.g. render a `Skeleton`-based summary bar or omit it) so no zero-state is ever painted.

**H2 — Error handling diverges from the established TableV2 pattern used by every sibling list view**
*Location:* `ConformaResultsTab.tsx` (passes `loadError={error instanceof Error ? error : undefined}` into `TableContainer`) vs `IntegrationTestsListView.tsx:193-195` and `SnapshotsListView.tsx` (both do `if (error) return getErrorState(error, loaded, '...')` **before** rendering the page shell).

`TableContainer`'s built-in error branch is intentionally minimal:

```48:50:.worktrees/feat-conforma-violations-tablev2/src/shared/components/TableV2/TableContainer.tsx
if (loadError) {
  return <div data-test="table-error">{loadError.message}</div>;
}
```

This renders a bare, unstyled text line in place of the table body, while the title, description, and (per H1) summary bar remain visible above a broken error message. Every other TableV2 page in the codebase instead uses the shared `getErrorState()` (icon + title + retry-friendly `EmptyState`) and bails out of the whole page render. Confirmed by `ConformaResultsTab.spec.tsx:224-234`, which only asserts the raw error text is present — no error icon, no consistent chrome.

*Impact:* Inconsistent, lower-quality error UX for a compliance-critical view; users get a plain sentence instead of the app's standard error affordance, and it now differs from the two other TableV2 pages a reviewer will naturally compare it to.

*Fix:* Drop `loadError` from `TableContainer` usage here and adopt the same `getErrorState(error, loaded, 'Conforma results')` early-return pattern already used in `IntegrationTestsListView`/`SnapshotsListView`, matching what `upstream/main` already did.

### Medium

**M1 — Filtered-empty state lost the shared `FilteredEmptyState` affordance (no "Clear all filters" action)**
*Location:* `ConformaResultsTab.tsx` lines 131–137.

```131:137:.worktrees/feat-conforma-violations-tablev2/src/components/Conforma/ConformaResultsTab/ConformaResultsTab.tsx
emptyState={
  <Bullseye>
    <Content component={ContentVariants.p}>
      No results match the current filters.
    </Content>
  </Bullseye>
}
```

Both `IntegrationTestsListView` and `SnapshotsListView` pass `<FilteredEmptyState onClearFilters={clearAll} />` for the same slot, which renders an icon, a title ("No results found"), body copy, and a "Clear all filters" button wired to `useFilterState(...).clearAll`. Conforma's version is plain text with no action and no icon — a dead end for a user who filtered too aggressively (they must manually find and clear each filter/chip). Note this was also true on `upstream/main` (not a regression introduced by this PR), but the migration was an opportunity to align with the now-standard TableV2 pattern and didn't take it, so it's flagged here as a consistency gap worth fixing in this PR.

*Fix:* Wire `useFilterState(filterConfigs)` (already imported) `clearAll` into a `<FilteredEmptyState onClearFilters={clearAll} />` for the `emptyState` prop.

**M2 — Expand-toggle header cell has no accessible label (regression vs. old markup)**
*Location:* `TableV2/TableHeader.tsx:35` (`enableExpansion && <Th />`) — affects `ConformaGroupedTable` and any other TableV2 consumer using `enableExpansion`.

`upstream/main`'s `ConformaGroupedTable` explicitly rendered `<Th screenReaderText="Expand" />` for the leading toggle column. The new shared `TableHeader` renders a bare `<Th />` with no `screenReaderText`, so screen-reader users get an unlabeled header cell for the expand/collapse column. This is TableV2 infrastructure, not Conforma-specific code, but it directly regresses accessibility for the feature under review (and every other TableV2 table with `enableExpansion`).

*Fix:* Add `screenReaderText="Expand"` (or similar) to the `<Th />` in `TableHeader.tsx` when `enableExpansion` is set.

**M3 — Per-row expand toggle has no distinguishing `aria-label`/`expandId`, so every row announces identically**
*Location:* `TableV2/TableRow.tsx:43-49`.

```42:49:.worktrees/feat-conforma-violations-tablev2/src/shared/components/TableV2/TableRow.tsx
{enableExpansion && (
  <Td
    expand={{
      rowIndex: virtualIndex,
      isExpanded: row.getIsExpanded(),
      onToggle: row.getToggleExpandedHandler(),
    }}
  />
)}
```

No `expandId` is passed, unlike the old hand-rolled Conforma table which used `expandId: \`${rowId}-expand\``. PatternFly's default expand button announces as a generic "Details" toggle for every row; without a per-row `expandId`/`aria-controls` link, assistive tech users cannot easily tell which group's row they're toggling or which expanded region a given button controls. Also shared infra, but worth calling out since it materially affects the accessibility of the exact feature being reviewed (a table whose primary interaction is expand/collapse).

*Fix:* Thread `getRowId`-derived id into `expand.expandId` (e.g. `` `${rowId}-expand` ``) in `TableRow.tsx`.

**M4 — `TableSkeleton` column count mismatch during loading**
*Location:* `ConformaResultsTab.tsx` (no `skeleton` prop passed to `TableContainer`) vs `TableContainer.tsx:46` default `<TableSkeleton columns={3} />`.

The Conforma grouped table has 4 columns (group label, Violations, Warnings, Successes) plus an expand toggle, but the loading skeleton defaults to 3 columns since no `skeleton` override is supplied. This is a minor layout mismatch: the skeleton will visibly reflow to a wider/narrower layout once real data with 4 columns replaces it.

*Fix:* Pass `skeleton={<TableSkeleton columns={4} />}` explicitly.

### Low

**L1 — `allExpanded` computation relies on an unsound cast**
*Location:* `ConformaResultsTab.tsx:65-66`.

```65:66:.worktrees/feat-conforma-violations-tablev2/src/components/Conforma/ConformaResultsTab/ConformaResultsTab.tsx
const allExpanded =
  groups.length > 0 && groups.every((g) => (expanded as Record<string, boolean>)[g.groupKey]);
```

`ExpandedState` from TanStack Table can legally be the boolean `true` (meaning "all rows expanded"), not just a `Record<string, boolean>`. The cast silently mis-evaluates in that case (property access on a boolean primitive returns `undefined`, not the expected "everything is expanded"). In practice this code path never sets `expanded` to `true` (only `{}` or an explicit per-group map), so it's not currently exploitable, but it's a latent bug if `Table`/`useTable` ever normalizes to `true`, or if this pattern is copy-pasted elsewhere. Consider a small type guard, e.g. `expanded === true || groups.every(...)`.

**L2 — No sorting on the grouped table (pre-existing, not a regression, but a missed opportunity)**
`TableV2`'s `Table` supports `enableSorting`, but `ConformaGroupedTable` doesn't enable it. This matches `upstream/main` behavior (the previous grouped view had no sorting either), so it's not a regression from this PR — flagging only because the migration would have been a natural point to add sortable "Violations"/"Warnings"/"Successes" columns, which seems like an obvious, low-cost UX win for a table whose main job is triage-by-severity.

**L3 — `noDataState` / `ConformaResultsToolbar`'s "no data at all" messaging remains a plain text `Bullseye`, unlike `AppEmptyState`-based sibling pages**
Pre-existing on `upstream/main`, unchanged by this PR — noting only for completeness/consistency tracking, not blocking.

---

## Verdict

**REQUEST_CHANGES**

Rationale: the interaction layer (grouping, expand/collapse, expand-all, filters, duplicate-collapsing) is correctly migrated and well tested, but H1 (misleading zero-count flash during load) and H2 (bare-text error state that diverges from the two other TableV2 list pages) are real, easily-observable regressions in a page whose entire purpose is to surface compliance/security violations accurately. Both are cheap to fix (H1: restore/adapt the early-return-while-loading pattern or hide the summary bar until loaded; H2: reuse `getErrorState`). M1 (filtered-empty "Clear filters" affordance) and M2/M3 (expand-toggle accessibility labeling) should also be addressed before merge for consistency with the rest of the TableV2 ecosystem this PR is contributing to.
