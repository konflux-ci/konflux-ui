# 1. Resource-scoped metadata compatibility and query plans

Date: 2026-11-26

## Status

Proposed

## Context

[ADR 0071](https://github.com/konflux-ci/architecture/blob/main/ADR/0071-konflux-labels-annotations-finalizers.md) replaces `appstudio.*` labels, annotations, and finalizers with `konflux-ci.dev` equivalents. [ADR 0056](https://github.com/konflux-ci/architecture/blob/main/ADR/0056-revised-component-model.md) introduces a second Component model (`konflux-ci.dev/v1alpha1`, see `src/models/component-v2.ts`) that coexists with the legacy `appstudio.redhat.com/v1alpha1` model. The UI must read and query both metadata families for an extended transition.

Upstream state at the time of writing:

| Service | State |
| --- | --- |
| build-service | Separate controllers per Component model. The new controller writes `build.konflux-ci.dev/component` and `pipelines.konflux-ci.dev/type` as labels, and `build.konflux-ci.dev/version` as an **annotation**. |
| integration-service | `pkg/keys` already implements old/new key pairs, new-key-preferred reads, style detection, and dual-list queries with UID deduplication. Snapshot creation still mostly writes legacy labels. |
| release-service | Not migrated. Still uses `appstudio.openshift.io/*` and `release.appstudio.openshift.io/*` labels and the legacy release finalizer. |

Current UI behaviour:

- Label keys are raw constants (`PipelineRunLabel` in `src/consts/pipelinerun.ts`) read directly by hooks, filters, rows, and utilities.
- `PipelineRunsPage` builds a Kubernetes `Selector` from filter state and passes it to `usePipelineRunsV2`.
- `usePipelineRunsV2` sends the same selector to the cluster watch, to KubeArchive (`createKubearchiveWatchResource`), and to Tekton Results, where `selectorToFilter` converts it to CEL.
- Some conditions are already handled outside the label selector (`filterByCommit`, `commitSearchTerm`), and `commitShaFilter` already ORs a label and an annotation in CEL.

Constraints that shape the decision:

1. **Kubernetes label selectors are AND-only.** `oldKey == v OR newKey == v` cannot be expressed in one selector.
2. **Annotations are not selectable** by Kubernetes or KubeArchive label selectors. Tekton Results CEL can query both labels and annotations.
3. **Keys are not globally meaningful.** The same key can appear on several resource kinds (for example release-service labels Release PipelineRuns with `release.appstudio.openshift.io/*`), and a selector is only meaningful together with the GVK it is sent with.
4. **Model is not metadata style.** Which contract applies comes from the route or resource GVK, not from a feature flag.

[PR #1836](https://github.com/konflux-ci/konflux-ui/pull/1836) proposed a `PipelineRunLabelConfig` object threaded through hooks, filter utilities, row `customData`, and commit utilities. It centralises keys but leaks Kubernetes label contracts into presentation code, has no answer for annotation-backed fields beyond implicit coupling (`matchesPipelineRunVersion`), and does not generalise to other resources.

## Decision

Introduce a **resource-scoped metadata compatibility layer** with a **backend-neutral semantic query** and **backend-specific query plans**. Start with PipelineRuns only.

### 1. Semantic fields and bindings

Each resource kind declares a schema that maps semantic fields to old/new bindings. A binding records only the key and where it lives; selector safety is a property of the backend, not of the binding.

```ts
type MetadataStyle = 'legacy' | 'konflux';
type MetadataLocation = 'label' | 'annotation';
type MetadataBinding = { key: string; location: MetadataLocation };

const pipelineRunMetadataSchema = {
  component: {
    legacy: { key: 'appstudio.openshift.io/component', location: 'label' },
    konflux: { key: 'build.konflux-ci.dev/component', location: 'label' },
  },
  pipelineType: {
    legacy: { key: 'pipelines.appstudio.openshift.io/type', location: 'label' },
    konflux: { key: 'pipelines.konflux-ci.dev/type', location: 'label' },
  },
  componentVersion: {
    legacy: { key: 'appstudio.openshift.io/version', location: 'label' },
    konflux: { key: 'build.konflux-ci.dev/version', location: 'annotation' },
  },
} as const satisfies Record<string, Partial<Record<MetadataStyle, MetadataBinding>>>;
```

A field may omit a style when no equivalent exists (for example Release fields stay legacy-only until release-service ships a contract).

### 2. Reads

`getPipelineRunMetadata(run, field, style?)`:

- with `style`: read only that binding (model-scoped views);
- without `style`: prefer the `konflux` binding, fall back to `legacy`, return `undefined` if neither exists. When both exist the new key wins.

Prefer structured `spec` fields over labels for display wherever they exist (Snapshot `spec.application` / `spec.componentGroup`, Release `spec.snapshot` / `spec.releasePlan`, `metadata.name` / `metadata.namespace`). Labels are for selection and for relationships `spec` does not express.

### 3. Semantic query

Filter state (UI-only `FilterConfig` values) is converted into semantic conditions. `FilterConfig` itself stays backend-agnostic.

```ts
type PipelineRunMetadataFilter = {
  field: keyof typeof pipelineRunMetadataSchema;
  operator: 'in' | 'contains';
  values: string[];
};

type PipelineRunQuery = {
  filters: PipelineRunMetadataFilter[];
  style?: MetadataStyle; // omitted = mixed old/new
};
```

- `in` is an exact match and can become a label selector expression.
- `contains` is a case-insensitive substring match (today's `textMatch` behaviour, for example the version filter). Kubernetes selectors cannot express it, so it is always a client filter for Kubernetes/KubeArchive and a CEL `.contains()` for Tekton Results.
- The query covers **metadata conditions only**. Existing non-metadata selector extensions (`filterByName`, `filterByCreationTimestampAfter`, `filterByCommit`) are passed through unchanged alongside the generated selector, so constraints such as excluding archived runs of a previously deleted component with the same name keep working.

### 4. Backend query plans

Adapters convert one semantic query into what each backend can execute.

**Kubernetes / KubeArchive:**

```ts
type PipelineRunK8sQueryPlan = {
  selectors: Selector[];
  clientFilters: PipelineRunMetadataFilter[];
};
```

`toPipelineRunK8sQueryPlan(query)`:

1. puts only `in` filters on `label` bindings into selectors;
2. returns `contains` filters and annotation-backed or missing bindings as `clientFilters`, never silently dropped or forced into a label selector;
3. returns one selector for a style-scoped query;
4. returns one selector per style for a mixed query (see below).

**Tekton Results:** `toPipelineRunTektonResultsFilter(query)` produces CEL from the same query. Labels and annotations can both be pushed down, and old/new bindings can be OR-ed in one expression, reusing the existing `AND` / `OR` / `IN` helpers in `src/utils/tekton-results.ts`.

Example — new Component model, filtering by component and version:

```ts
toPipelineRunK8sQueryPlan({
  style: 'konflux',
  filters: [
    { field: 'component', operator: 'in', values: ['api'] },
    { field: 'componentVersion', operator: 'in', values: ['v1'] },
  ],
});
// {
//   selectors: [{ matchExpressions: [
//     { key: 'build.konflux-ci.dev/component', operator: 'In', values: ['api'] },
//   ] }],
//   clientFilters: [{ field: 'componentVersion', operator: 'in', values: ['v1'] }],
// }
```

The page applies `clientFilters` to the data returned by `usePipelineRunsV2`, using the same `getPipelineRunMetadata` reader. The equivalent Tekton Results query pushes the version annotation into CEL and returns no client filters.

### 5. Mixed old/new queries

- **Style-scoped** (legacy route or new route): one selector using that style's keys. Do not exclude the opposite key — dual-labelled transition objects stay visible in both models.
- **Mixed** (genuinely cross-model lists only):
  - Kubernetes/KubeArchive: one query per style on a **single** selector field, merged and deduplicated by `metadata.uid`. When the new binding is a label, the legacy query adds `newKey DoesNotExist` so the new key wins and duplicates are avoided (mirrors integration-service `keys.DualList`). When the new binding is an annotation, Kubernetes cannot test its absence; UID deduplication plus the client filter provide correctness.
  - A run in transition can carry a new key for one field and a legacy key for another, so it would match neither all-legacy nor all-konflux selector. Mixed plans therefore never AND several style-dependent fields in one selector: only one field goes to the per-style selectors, and every other style-dependent filter becomes a client filter evaluated with the style-less (new-key-preferred) reader after merging. Generating per-field style combinations is rejected because it grows as 2^n queries.
  - Tekton Results: one CEL expression that ORs the bindings, preserving new-key precedence.

Mixed lists are added only where a view genuinely needs them; model-scoped views are the default.

### 6. Resource scoping and cross-resource queries

- Schemas, readers, and query builders are **per resource kind** (`getPipelineRunMetadata`, `getReleaseMetadata`, `toPipelineRunK8sQueryPlan`, `toReleaseK8sQueryPlan`). They may share one generic internal implementation, but callers never pass schemas or contracts around.
- A selector is used only with the resource model it was built for. PipelineRun and Release selector conditions are never combined.
- A key shared by two resources is allowed only when declared explicitly in both schemas (for example a shared `applicationLegacyBinding` constant referenced by the PipelineRun and Release schemas). There is no global key-to-field lookup.
- Cross-resource work is **query composition**: read the source resource, build a query for the target resource, convert it with the target's adapter. For example, PipelineRuns of a Release are found by reading the Release's name and namespace and building a PipelineRun query on the PipelineRun fields `releaseName`, `releaseNamespace`, and `pipelineType` — fields that belong to the PipelineRun schema because release-service writes them on PipelineRuns.

### 7. Model detection

The metadata style for a view is chosen by, in order: route context, resource GVK, and only as a last resort the presence of new owned keys. Feature flags may gate routes or pages but never select a metadata contract.

### 8. Finalizers

The UI does not write or mutate finalizers and does not branch on finalizer names. If deletion state becomes user-visible, the layer exposes a semantic value (for example `deletionBlockedBy: string[]`) normalised across both families.

### Pagination with client-side filters

When a query plan contains `clientFilters`, server-side `limit` / page size no longer equals the final page size:

- Do not pass `limit` to `usePipelineRunsV2` for such queries. Today the hook applies `limit` to live cluster runs and decides whether to query the archive from the unfiltered count, so a newer non-matching run can push out an older matching one before the caller filters, and that run cannot be recovered by fetching more pages. Callers apply the limit after client filtering; phase 7 may move client filtering into the hook before limiting and source selection.
- A server page may yield fewer (or zero) matching items after client filtering. The caller must keep fetching pages until it has enough matches or the source is exhausted, and must expose "loading more" honestly rather than reporting an empty result.
- Optimisations that rely on `limit: 1` (for example "latest run for a version") are invalid while the field is client-filtered and must scan instead, bounded by an explicit page budget.
- `hasNextPage` reflects the server cursor, not the filtered result.
- Prefer pushing the condition to Tekton Results CEL where that backend is in use, which removes the client filter entirely.

The upstream fix is to make `build.konflux-ci.dev/version` (or an equivalent) a label so it becomes selector-safe; this ADR does not depend on that change.

### Implementation phases

1. **PipelineRun metadata module** — schema, `getPipelineRunMetadata`, `toPipelineRunK8sQueryPlan`, `toPipelineRunTektonResultsFilter`, with unit tests covering both styles, annotation fallback, and mixed selectors. No UI changes.
2. **PipelineRun list adoption** — `PipelineRunsPage` and component-scoped PipelineRun lists build a `PipelineRunQuery` from route model + filter state, pass the K8s selector as `selector` and the client-filter conditions converted with `toPipelineRunTektonResultsFilter` as `filter` to the unchanged `usePipelineRunsV2` (Tekton Results ANDs both, so annotation-backed fields are pushed down there), and apply `clientFilters` afterwards for the cluster and KubeArchive data. Replaces direct `PipelineRunLabel` reads in rows and utilities with semantic reads.
3. **New Component model support** — new-model routes pass `style: 'konflux'`; no label config threaded through components. Rework PR #1836 on top of phases 1–2.
4. **Snapshot schema** — legacy and Konflux bindings once integration-service writes new Snapshot metadata; prefer `spec` fields for display.
5. **Release schema** — legacy-only until release-service ships a `konflux-ci.dev` contract; add Konflux bindings then.
6. **Mixed lists** — dual-query support only for views that need cross-model lists.
7. **`usePipelineRunsV2` backend adapters** — accept a query plan directly only when KubeArchive is removed or a mixed list requires it.
8. **Legacy removal** — drop legacy bindings after all services have migrated and existing resources are backfilled.

## Alternatives considered

- **Raw per-resource constants (status quo)** — simple, but every migration touches every consumer, there is no shared fallback policy, and old/new behaviour drifts per view.
- **Per-resource label config objects (`PipelineRunLabelConfig`, PR #1836)** — centralises keys but threads a transport-level contract through hooks, utilities, and presentation components; encodes no distinction between label- and annotation-backed fields; and duplicates model and selector logic per resource. Rejected.
- **Full immediate cross-resource refactor (mandatory view models for all resources, generic query AST, `usePipelineRunsV2` rewrite)** — the eventual direction, but too large to review and verify in one change and blocked on upstream services that have not migrated. Rejected for now; the phased path keeps it reachable.
- **Global `selectorSafe` flag on bindings** — rejected because selector safety depends on the backend (Kubernetes vs Tekton Results CEL).
- **Feature-flag-driven metadata selection** — rejected; couples data contracts to user-visible gating and breaks when both models coexist.
- **Server-side normalised API / BFF** — best long-term end state (stable DTOs, no compatibility code in the browser) but requires a new API surface and cross-team work. Out of scope; this layer is designed so it can be replaced by such an API later.

## Consequences

- One place per resource defines old/new keys; migration and legacy removal touch the schema, not consumers.
- Presentation components receive semantic values, not label contracts.
- Annotation-backed fields are explicit client filters, so pagination cost is visible and testable instead of hidden.
- Tekton Results and Kubernetes backends share one query model; Tekton Results can serve mixed queries in one request.
- Cost: an initial module plus contract tests, and a per-view migration in later phases. Client-side filtering for `componentVersion` on Kubernetes/KubeArchive remains until build-service makes version a label.
- Open questions: whether build-service will move `build.konflux-ci.dev/version` to a label; when integration-service and release-service ship new Snapshot and Release metadata; which views genuinely need mixed lists.

## Links

- [ADR 0071 — Replace Appstudio Labels, Annotations, and Finalizers with Konflux equivalents](https://github.com/konflux-ci/architecture/blob/main/ADR/0071-konflux-labels-annotations-finalizers.md)
- [ADR 0056 — Revised Component Model](https://github.com/konflux-ci/architecture/blob/main/ADR/0056-revised-component-model.md)
- [konflux-ui PR #1836](https://github.com/konflux-ci/konflux-ui/pull/1836)
- [integration-service `pkg/keys`](https://github.com/konflux-ci/integration-service/tree/main/pkg/keys)
- [Kubernetes labels and selectors](https://kubernetes.io/docs/concepts/overview/working-with-objects/labels/)
- [Kubernetes annotations](https://kubernetes.io/docs/concepts/overview/working-with-objects/annotations/)
- [KubeArchive integration](../kubearchive.md)
- [Filter system](../guidelines/filter-system.md)
