# Code Review — `feat/conforma-violations-tablev2`

**Branch:** `feat/conforma-violations-tablev2`
**Base:** `upstream/main` (merge-base)
**Reviewed:** 2026-07-16
**Reviewer:** fullsend (local pre-push)

---

## Summary

Migrates the Conforma results tab from the legacy table + FilterContext system to the standardised TableV2 + config-driven Filter system. Three commits:

1. **feat: add controlled expansion props to TableV2** — Adds `expanded` and `onExpandedChange` optional props to `TableProps`, `UseTableOptions`, and `Table`, threading them to TanStack's `useReactTable`.
2. **feat: migrate Conforma results table to TableV2** — Rewrites `ConformaGroupedTable`, `ConformaResultsTab`, and `ConformaResultsToolbar` to use `Table`, `TableContainer`, `FilterToolbar`, `defineFilters`, `useFilterState`, and `useFilteredData`. Deletes the now-unused `ConformaResultsListHeader` and `ConformaResultsListRow`.
3. **test: update Conforma specs for TableV2 migration** — Updates all three spec files for the new API surface.

**Files changed:** 15 (7 modified, 2 deleted, 1 added in Conforma; 5 modified in shared TableV2)

---

## Dimension Evaluations

### 1. Correctness

The migration is structurally sound. Column definitions, filter configs, controlled expansion, and the `TableContainer` state machine are all wired correctly and follow the patterns in `docs/guidelines/table-v2.md` and `docs/guidelines/filter-system.md`.

**Findings in this dimension are listed below.**

### 2. Security

No security concerns identified. The change does not modify authentication, authorisation, permissions, or data exposure. No injection vectors or permission manifest changes.

### 3. Intent & Coherence

The change aligns with the project's stated direction: `AGENTS.md` mandates that "new list/table views **must** use `TableV2`". This migration converts an existing view to the standardised system while adding a reusable controlled-expansion capability to the shared component. Scope is appropriate. Complexity is proportional.

### 4. Style / Conventions

Follows project conventions well:
- `~/` absolute imports, no deep relative paths
- `data-test` attributes (not `data-testid`)
- `defineFilters` + `useFilterState` + `useFilteredData` pattern
- `ColumnDefinition` + `Table` pattern
- Uses `textMatch` from `~/utils/text-filter-utils` instead of hand-rolling

One minor observation noted below (empty `TOOLBAR_GROUPS`).

### 5. Docs Currency

The `docs/guidelines/table-v2.md` props table does not include the new `expanded` and `onExpandedChange` props. These are part of the public API surface of `TableProps` and should be documented.

### 6. Cross-repo Contracts

No cross-repo impact. Changes are additive (new optional props) to the shared `TableV2` component. No existing consumers are affected.

---

## Findings

### F1 — Error narrowing may silently swallow non-Error errors

| Field | Value |
| ------------- | ---------------------------------------------------------------- |
| **Severity** | medium |
| **Category** | logic-error |
| **Location** | `src/components/Conforma/ConformaResultsTab/ConformaResultsTab.tsx:122` |
| **Actionable**| false |

**Description:**

```tsx
loadError={error instanceof Error ? error : undefined}
```

The `error` field on `ApplicationConformaResults` is typed `unknown`. It is built from `componentsError ?? taskRunsError ?? aggregatedLogError` in `useApplicationConformaResults`. The K8s watch hooks (`useComponents`, `useTaskRunsV2`) may return error objects that are not `instanceof Error` (e.g., plain objects with a `.code` property). When this happens, `loadError` becomes `undefined` and `TableContainer` renders the table content instead of an error state — silently hiding the failure from the user.

The previous implementation used `getErrorState(error, loaded, 'Conforma results')` which handled arbitrary error shapes, including HTTP error codes and non-Error objects, and rendered a structured `ErrorEmptyState`.

**Remediation:**

Either:
- Normalise the error before passing it: `loadError={error ? (error instanceof Error ? error : new Error(String(error))) : undefined}`
- Or use `getErrorState` from `~/shared/utils/error-utils` to render a richer error experience (consistent with other views in the app).

---

### F2 — Dead export: `filterResults` in `conforma-grouping-utils.ts`

| Field | Value |
| ------------- | ---------------------------------------------------------------- |
| **Severity** | low |
| **Category** | dead-code |
| **Location** | `src/components/Conforma/ConformaResultsTab/conforma-grouping-utils.ts:91-106` |
| **Actionable**| true |

**Description:**

The `filterResults` function is still exported from `conforma-grouping-utils.ts` but has zero importers after this migration — it was only used by `ConformaResultsTab.tsx`, which now uses `useFilteredData` from the Filter system instead. This is dead code.

**Remediation:**

Remove the `filterResults` function and its `textMatch` import (if no longer used elsewhere in the file). Note: `textMatch` is still imported at line 3 and used on line 30 (`groupByRule` key logic doesn't use it — actually checking: line 3 imports `textMatch` but it's only used in `filterResults`). After removing `filterResults`, check whether the `textMatch` import can also be removed.

*Update:* Checking the file — `textMatch` is imported at line 3 and only used inside `filterResults` (lines 97-98). Removing `filterResults` should also remove the `textMatch` import from this file.

---

### F3 — Missing docs for controlled expansion props

| Field | Value |
| ------------- | ---------------------------------------------------------------- |
| **Severity** | low |
| **Category** | docs-stale |
| **Location** | `docs/guidelines/table-v2.md` (props table, approx. lines 48-64) |
| **Actionable**| true |

**Description:**

The `Table` props table in `docs/guidelines/table-v2.md` does not include the new `expanded` and `onExpandedChange` props. These are now part of the `TableProps` interface and should be documented alongside `enableExpansion` and `expandedContent` to guide future consumers of the controlled expansion feature.

**Remediation:**

Add two rows to the props table:

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `expanded` | `ExpandedState` | No | Controlled expansion state (use with `enableExpansion`) |
| `onExpandedChange` | `OnChangeFn<ExpandedState>` | No | Updater for controlled expansion state |

---

### F4 — New search filter includes `code` field (behavior change)

| Field | Value |
| ------------- | ---------------------------------------------------------------- |
| **Severity** | info |
| **Category** | behavior-change |
| **Location** | `src/components/Conforma/ConformaResultsTab/conforma-table-config.tsx:60-63` |
| **Actionable**| false |

**Description:**

The new filter config's search predicate matches against `item.code ?? ''`, `item.title`, and `item.component`. The previous `filterResults` only matched against `item.title` and `item.component`. Adding `code` is an improvement (it's the stable rule identifier and is likely what users would search for), but it's a silent behavior change from the prior filter.

No action needed — this is an improvement.

---

### F5 — Empty `TOOLBAR_GROUPS` constant

| Field | Value |
| ------------- | ---------------------------------------------------------------- |
| **Severity** | info |
| **Category** | style |
| **Location** | `src/components/Conforma/ConformaResultsTab/ConformaResultsToolbar.tsx:37` |
| **Actionable**| false |

**Description:**

```tsx
const TOOLBAR_GROUPS: Record<string, ToolbarGroupConfig> = {};
```

This empty object is passed to `FilterToolbar`'s `groups` prop. If `FilterToolbar` accepts `undefined` or defaults gracefully for this prop, the constant is unnecessary boilerplate. If the prop is required, the empty object is the correct approach.

No action required — minor style observation.

---

## Overall Outcome

| Outcome | Value |
| --------------- | ---------------------------------------- |
| **Decision** | **comment-only** |
| **Critical** | 0 |
| **High** | 0 |
| **Medium** | 1 (F1: error narrowing) |
| **Low** | 2 (F2: dead code, F3: docs) |
| **Info** | 2 (F4: behavior change, F5: style) |

The medium finding (F1) is worth addressing but does not block the PR on its own. The migration is well-executed and follows project conventions. The controlled expansion addition to TableV2 is clean, well-tested, and backward-compatible.
