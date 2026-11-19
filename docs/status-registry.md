# 🎨 Status Registry — Tech Docs

This document explains how our **config-driven status registry** works, how statuses are derived and displayed, and how to add new statuses or extend the system to new resource types.

---

## 1. What lives where?

```
src/
  shared/
    utils/
      status-registry.ts          # generic factory — createStatusRegistry()
    components/
      StatusRegistry/
        StatusRegistryComponents.tsx  # generic React components + createStatusComponents()
  utils/
    plr-status-config.tsx         # PipelineRun registry + PLRStatus namespace
```

**Layers:**

| Layer | File | Purpose |
| ----- | ---- | ------- |
| Generic factory | `status-registry.ts` | Creates registries for any resource type |
| Generic React | `StatusRegistryComponents.tsx` | Components, hooks, filter builders — resource-agnostic |
| Resource config + namespace | `plr-status-config.tsx` | PipelineRun predicates, categories, weights + `PLRStatus.*` |

---

## 2. Core concepts

### Status entry

Each status is defined once in a config array:

```ts
{
  status: runStatus.Running,
  match: (_plr, ctx) => ctx.succeededStatus === 'Running' && !STOPPING_REASONS.has(ctx.succeededCond?.reason ?? ''),
  category: 'info',
  weight: 10,
  tags: ['unfinished', 'active'],
}
```

| Property | Purpose |
| -------- | ------- |
| `status` | The status value (from your enum/union) |
| `match` | Predicate — receives the resource and a pre-computed context |
| `category` | Semantic group: `success`, `danger`, `warning`, `info`, `neutral` |
| `weight` | Display sort order (lower = more prominent in lists/filters) |
| `label` | Optional display label override (defaults to status string) |
| `pfRunStatus` | Optional PatternFly RunStatus override (defaults from category) |
| `color` | Optional color override `{ hex, name }` (defaults from category) |
| `tags` | Optional string tags for grouping (e.g. `'unfinished'`, `'terminal'`) |

### Two separate orderings

- **Array position** = predicate evaluation order (first match wins in `deriveStatus()`)
- **`weight`** = display/sort order in tables and filter dropdowns

These are intentionally decoupled. For example, `Running` must be evaluated *after* `Cancelling` and `Pending` (array position 4), but should appear *first* in a sorted table (weight 10).

### Categories

Categories provide default colors and PatternFly RunStatus mappings:

| Category | Color | PF RunStatus | Use for |
| -------- | ----- | ------------ | ------- |
| `success` | green | `Succeeded` | Completed successfully |
| `danger` | red | `Failed` | Errors, failures |
| `warning` | yellow | `Cancelled` | Cancelled, cancelling |
| `info` | blue | `Running` | Active, in-progress |
| `neutral` | grey | `Pending` | Pending, skipped, unknown |

### Tags

Tags replace boolean flags for flexible grouping:

```ts
registry.hasTag(runStatus.Running, 'unfinished')  // true
registry.getStatusesByTag('terminal')              // [Failed, Cancelled, Skipped, Succeeded]
```

### Context optimization

For resources where predicate evaluation touches the same fields repeatedly, define a `createContext` function:

```ts
createContext: (plr) => ({
  succeededCond: plr.status?.conditions?.find(c => c.type === 'Succeeded'),
  // ... computed once, passed to every match predicate
})
```

This avoids redundant `.find()` calls across predicates.

---

## 3. Using the PipelineRun namespace

All PipelineRun status display goes through `PLRStatus`:

```tsx
import { PLRStatus } from '~/utils/plr-status-config';
```

### In a table column

```tsx
{
  id: 'status',
  header: 'Status',
  accessorFn: (row) => PLRStatus.registry.deriveStatus(row),
  sortable: true,
  cell: (info) => <PLRStatus.StatusIconWithText status={info.getValue() as runStatus} />,
}
```

### In a component

```tsx
const display = PLRStatus.useStatusDisplay(pipelineRun);
// display.status, display.label, display.color, display.category, display.runStatus
```

### Filter integration

```tsx
const filterConfigs = defineFilters<PipelineRunKind>()([
  {
    type: 'multiSelect',
    param: 'status',
    label: 'Status',
    filterFn: PLRStatus.statusFilterFn,
    group: 'attributes',
  },
]);

const optionsMap = {
  status: PLRStatus.filterOptions,  // includes colored icons
};
```

### Available on the namespace

| Member | Type | Description |
| ------ | ---- | ----------- |
| `StatusIcon` | Component | Topology status icon |
| `StatusIconWithText` | Component | Icon + label text |
| `StatusIconWithTextLabel` | Component | Icon + label in PF Label |
| `useStatusDisplay(resource)` | Hook | Derives status + all display props |
| `filterOptions` | `FilterOption[]` | Dropdown options with icons |
| `statusFilterFn(item, values)` | Function | Filter predicate for `defineFilters` |
| `registry` | `StatusRegistry` | Direct access to the underlying registry |

---

## 4. Adding a new PipelineRun status

Example: adding a `Queued` status.

**Step 1.** Add to the enum in `src/consts/pipelinerun.ts`:

```ts
export enum runStatus {
  // ... existing
  Queued = 'Queued',
}
```

**Step 2.** Add ONE entry to the statuses array in `src/utils/plr-status-config.tsx`:

```ts
{
  status: runStatus.Queued,
  match: (_plr, ctx) => ctx.succeededCond?.reason === 'Queued',
  category: 'neutral',
  weight: 18,
  tags: ['unfinished'],
},
```

Place it at the correct array position for evaluation order (e.g. after Pending but before Cancelled).

**That's it.** The status automatically gets:
- ✅ Correct color and icon (from category)
- ✅ Filter dropdown entry (with icon, sorted by weight)
- ✅ Table column rendering
- ✅ Sort weight for table ordering
- ✅ Tag-based grouping (`unfinished`)

---

## 5. Adding a new resource type

Example: adding Release status support.

**Step 1.** Define the registry config in a new file (e.g. `src/utils/release-status-display.ts`):

```ts
import { createStatusRegistry } from '~/shared/utils/status-registry';
import { ReleaseKind } from '~/types';

type ReleaseStatus = 'Deploying' | 'Deployed' | 'Failed' | 'Unknown';

export const RELEASE_STATUS_REGISTRY = createStatusRegistry<
  ReleaseStatus,
  ReleaseKind
>()({
  statuses: [
    { status: 'Deploying', match: (r) => r.status?.phase === 'Deploying', category: 'info', weight: 10, tags: ['active'] },
    { status: 'Failed', match: (r) => r.status?.phase === 'Failed', category: 'danger', weight: 40 },
    { status: 'Deployed', match: (r) => r.status?.phase === 'Deployed', category: 'success', weight: 60 },
    { status: 'Unknown', match: () => true, category: 'neutral', weight: 90 },
  ],
});
```

**Step 2.** Create the React namespace (e.g. `src/utils/release-status-display-react.tsx`):

```ts
import { createStatusComponents } from '~/shared/components/StatusRegistry/StatusRegistryComponents';
import { RELEASE_STATUS_REGISTRY } from './release-status-display';

export const ReleaseStatus = createStatusComponents(RELEASE_STATUS_REGISTRY);
```

**Step 3.** Use it:

```tsx
import { ReleaseStatus } from '~/utils/release-status-display-react';

<ReleaseStatus.StatusIconWithText status={status} />
const display = ReleaseStatus.useStatusDisplay(release);
```

---

## 6. Registry API reference

All methods are available on the object returned by `createStatusRegistry()()`:

| Method | Returns | Description |
| ------ | ------- | ----------- |
| `deriveStatus(obj)` | `TStatus` | Evaluates predicates in array order, returns first match |
| `getEntry(status)` | `StatusEntryConfig` | Full config entry |
| `getLabel(status)` | `string` | Display label (or status string if no override) |
| `getCategory(status)` | `StatusCategory` | Semantic category |
| `getWeight(status)` | `number` | Sort weight |
| `getColor(status)` | `string` | Hex color string |
| `getColorName(status)` | `string` | PatternFly color name (`'green'`, `'red'`, etc.) |
| `getRunStatus(status)` | `RunStatus` | PatternFly topology RunStatus |
| `hasTag(status, tag)` | `boolean` | Whether the status has a given tag |
| `allStatuses` | `TStatus[]` | All statuses sorted by weight |
| `getStatusesByTag(tag)` | `TStatus[]` | Statuses with a tag, sorted by weight |
| `weightMap` | `Record<TStatus, number>` | Status → weight lookup |
| `getStatusConfigs(exclude?)` | `StatusConfigDisplay[]` | Display configs sorted by weight |
| `createFilterFn(selected)` | `(obj) => boolean` | Filter predicate using `deriveStatus()` internally |

---

## 7. Important: filtering correctness

**Never use individual `match` predicates for filtering.** They are order-dependent — a resource might match an earlier predicate but `deriveStatus()` returns a different status because of evaluation order.

Always use `createFilterFn()` or `PLRStatus.statusFilterFn()`, which derive the full status first, then check against the selected values.

```ts
// ✅ Correct — uses deriveStatus internally
PLRStatus.statusFilterFn(plr, [runStatus.Running])

// ❌ Wrong — bypasses evaluation order
const entry = registry.getEntry(runStatus.Running);
entry.match(plr, ctx)  // might be true even if deriveStatus returns Cancelling
```
