# Hooks and Data Fetching Guide

This document covers the data fetching hooks, K8s resource patterns, and state management hooks used in konflux-ui.

## useK8sWatchResource

The primary hook for fetching Kubernetes resources. Located in `src/k8s/hooks/useK8sWatchResource.ts`.

### Signature

```ts
useK8sWatchResource<R extends K8sResourceCommon | K8sResourceCommon[]>(
  resourceInit: WatchK8sResource | undefined,
  model: K8sModelCommon,
  queryOptions?: TQueryOptions<R>,
  options?: object,
): K8sWatchResult<R>
```

`K8sWatchResult<R>` is defined in `src/k8s/hooks/useK8sWatchResource.ts` as `UseQueryResult<R>` plus watch-specific fields.

### Data Flow

```
Component
  -> useK8sWatchResource
      -> React Query (useQuery) for data fetch + caching
      -> WebSocket (useK8sQueryWatch) for live updates (when watch: true)
          -> queryClient.setQueryData() on ADDED/MODIFIED/DELETED events
```

### Return Value

Returns a `K8sWatchResult<R>` (see `src/k8s/hooks/useK8sWatchResource.ts`), which extends React Query's `UseQueryResult<R>` with:

| Field | Type | Description |
| --- | --- | --- |
| `isWatchDegraded` | `boolean` | `true` when the WebSocket connection degraded to polling after max retries |

```ts
const { data, isLoading, error, isWatchDegraded } = useK8sWatchResource<MyKind[]>(
  { groupVersionKind, namespace, isList: true },
  MyModel,
);
```

### Common Usage Patterns

#### Pattern 1: List resources

```ts
const { data, isLoading, error } = useK8sWatchResource<ComponentKind[]>(
  { groupVersionKind: ComponentGroupVersionKind, namespace, isList: true },
  ComponentModel,
);
```

#### Pattern 2: Single resource by name

```ts
const { data, isLoading, error } = useK8sWatchResource<ApplicationKind>(
  { groupVersionKind: ApplicationGroupVersionKind, namespace, name: applicationName },
  ApplicationModel,
);
```

#### Pattern 3: Conditional fetch (disabled when params missing)

```ts
const { data, isLoading, error } = useK8sWatchResource<ComponentKind>(
  componentName
    ? { groupVersionKind: ComponentGroupVersionKind, namespace, name: componentName }
    : undefined,   // undefined disables the query
  ComponentModel,
);
```

#### Pattern 4: List with label selector

```ts
const { data, isLoading, error } = useK8sWatchResource<ReleaseKind[]>(
  {
    groupVersionKind: ReleaseGroupVersionKind,
    namespace,
    isList: true,
    watch: true,
    selector: { matchLabels: { [PipelineRunLabel.APPLICATION]: applicationName } },
  },
  ReleaseModel,
);
```

#### Pattern 5: Filter at query level

```ts
const { data, isLoading, error } = useK8sWatchResource<ApplicationKind[]>(
  { groupVersionKind: ApplicationGroupVersionKind, namespace, isList: true },
  ApplicationModel,
  { filterData: (resources) => resources?.filter(r => !r.metadata?.deletionTimestamp) ?? [] },
);
```

#### Pattern 6: No retry (fall back to alternate source)

```ts
const { data, isLoading, error } = useK8sWatchResource<PipelineRunKind[]>(
  { groupVersionKind, namespace, isList: true, watch: true },
  PipelineRunModel,
  { retry: false },  // Don't retry -- fall back to Tekton Results on error
);
```

### Building Custom Hooks

Every domain hook wrapping `useK8sWatchResource` follows a consistent pattern:

```ts
export const useMyResources = (namespace: string): [MyKind[], boolean, unknown] => {
  const { data, isLoading, error } = useK8sWatchResource<MyKind[]>(
    { groupVersionKind: MyGroupVersionKind, namespace, isList: true },
    MyModel,
    { filterData: (resources) => resources?.filter(r => !r.metadata?.deletionTimestamp) ?? [] },
  );

  return useMemo(() => [data ?? [], !isLoading, error], [data, isLoading, error]);
};
```

**Important**: Always memoize the return value. The `[data, loaded, error]` tuple convention is used throughout the codebase.

## K8s CRUD Operations

Located in `src/k8s/query/fetch.ts`. These functions automatically invalidate the React Query cache after mutations.

| Function | HTTP Method | Cache Effect |
|---|---|---|
| `K8sQueryCreateResource` | POST | `invalidateQueries` for namespace list |
| `K8sQueryUpdateResource` | PUT | `invalidateQueries` for namespace list |
| `K8sQueryPatchResource` | PATCH | `invalidateQueries` for namespace list |
| `K8sQueryDeleteResource` | DELETE | `removeQueries` for item + `invalidateQueries` for list |

### Usage

```ts
import { K8sQueryCreateResource, K8sQueryDeleteResource } from '~/k8s';

// Create
await K8sQueryCreateResource({
  model: ApplicationModel,
  resource: {
    apiVersion: `${ApplicationModel.apiGroup}/${ApplicationModel.apiVersion}`,
    kind: ApplicationModel.kind,
    metadata: { name: 'my-app', namespace },
    spec: { displayName: 'My Application' },
  },
});

// Delete
await K8sQueryDeleteResource({
  model: ApplicationModel,
  queryOptions: { name: 'my-app', ns: namespace },
});

// Patch
await K8sQueryPatchResource({
  model: ApplicationModel,
  queryOptions: { name: 'my-app', ns: namespace },
  patches: [{ op: 'replace', path: '/spec/displayName', value: 'New Name' }],
});
```

**Note**: Mutations are imperative promise-based calls, not wrapped in `useMutation`. Use them in event handlers and form submit callbacks.

## Resource Models

Located in `src/models/`. Every model defines two exports:

```ts
// Model definition
export const ApplicationModel: K8sModelCommon = {
  apiGroup: 'appstudio.redhat.com',
  apiVersion: 'v1alpha1',
  kind: 'Application',
  plural: 'applications',
  namespaced: true,
};

// GroupVersionKind for useK8sWatchResource
export const ApplicationGroupVersionKind: K8sGroupVersionKind = {
  group: ApplicationModel.apiGroup,
  version: ApplicationModel.apiVersion,
  kind: ApplicationModel.kind,
};
```

When creating a new model, always derive `GroupVersionKind` from the model to avoid duplication.

## useK8sAndKarchResources (Cluster + Archive)

For resources that may be in either the live cluster or KubeArchive (historical store):

```ts
// List resources from both sources
const { data, isLoading, error, getSource } = useK8sAndKarchResources<SnapshotKind>(
  { groupVersionKind: SnapshotGroupVersionKind, namespace, isList: true },
  SnapshotModel,
);

// Check where a specific resource came from
const source = getSource(resource); // ResourceSource.Cluster or ResourceSource.Archive

// Single resource with cluster-first, archive-fallback
const { data, isLoading, fetchError, source } = useK8sAndKarchResource<ReleaseKind>(
  { groupVersionKind: ReleaseGroupVersionKind, namespace, name: releaseName },
  ReleaseModel,
);
```

## React Query Patterns

### useQuery for REST APIs

```ts
import { useQuery } from '@tanstack/react-query';

export const useMyData = (namespace: string) => {
  return useQuery({
    queryKey: ['my-data', namespace],
    queryFn: () => fetchMyData(namespace),
    staleTime: 30_000,
    enabled: !!namespace,
  });
};
```

### useInfiniteQuery for Paginated Data

Used for Tekton Results (historical pipeline/task runs):

```ts
const { data, isLoading, hasNextPage, fetchNextPage, isFetchingNextPage } = useInfiniteQuery({
  queryKey: ['tekton-results', namespace, options],
  queryFn: ({ pageParam }) => fetchPipelineRuns(namespace, { ...options, pageToken: pageParam }),
  getNextPageParam: (lastPage) => lastPage.nextPageToken,
  select: (data) => data.pages.flatMap(page => page.items), // Flatten pages
});
```

## Common Hooks Reference

### useNamespace / useNamespaceInfo

```ts
import { useNamespace } from '~/shared/providers/Namespace/useNamespaceInfo';

const namespace = useNamespace(); // Returns the active namespace string

// For full context:
import { useNamespaceInfo } from '~/shared/providers/Namespace/useNamespaceInfo';
const { namespace, namespacesLoaded, namespaces } = useNamespaceInfo();
```

### useAccessReviewForModel (RBAC)

```ts
import { useAccessReviewForModel } from '~/utils/rbac';

const [canCreate, loaded] = useAccessReviewForModel(ApplicationModel, 'create');
const [canDelete, loaded] = useAccessReviewForModel(ApplicationModel, 'delete');
const [canPatch, loaded] = useAccessReviewForModel(ApplicationModel, 'patch');
```

Verbs: `'get' | 'list' | 'create' | 'update' | 'patch' | 'delete' | 'watch'`

Always use the `loaded` flag to show loading state while RBAC is resolving. `isAllowed` defaults to `false` (fail-secure) until loaded.

### useLocalStorage

```ts
import { useLocalStorage } from '~/shared/hooks/useLocalStorage';

const [value, setValue, removeValue] = useLocalStorage<string[]>('my-key', []);

// setValue accepts direct value or updater
setValue(['new-value']);
setValue((prev) => [...prev, 'appended']);
```

Cross-tab synced via `useSyncExternalStore` + native `storage` event.

### useSearchParam / useSearchParamBatch

```ts
import { useSearchParamBatch } from '~/hooks/useSearchParam';

const [getParams, setParams, unsetParams] = useSearchParamBatch();

// Read
const nameFilter = getParams().name;

// Write
setParams({ name: 'search-term', status: 'active' });

// Clear
unsetParams();
```

### useSortedResources

```ts
import { useSortedResources } from '~/hooks/useSortedResources';

const sortPaths = {
  0: 'metadata.name',
  1: 'metadata.creationTimestamp',
};

const sorted = useSortedResources(data, activeSortIndex, activeSortDirection, sortPaths);
```

### useDeepCompareMemoize

```ts
import { useDeepCompareMemoize } from '~/shared/hooks';

// Returns the previous reference if the value is deep-equal
const stableFilters = useDeepCompareMemoize({
  name: unparsedFilters.name ?? '',
  status: unparsedFilters.status ?? [],
});
```

### useLazyActionMenu

Defers expensive context loading (resource fetches, etc.) until the action menu is opened. Actions show "Checking permissions..." while loading:

```ts
import { useLazyActionMenu, composeLazyActions, LazyActionHookResult } from '~/shared/hooks';
import { Action } from '~/shared/components/action-menu/types';

// Single action group with lazy-loaded context
const useMyActionsLazy = (resource: MyKind): LazyActionHookResult<Action> => {
  return useLazyActionMenu({
    loadContext: async () => {
      const related = await k8sQueryGetResource<RelatedKind>({
        model: RelatedModel,
        queryOptions: { ns: namespace, name: resource.metadata.labels?.relatedName },
      });
      return { related };
    },
    buildActions: (ctx): Action[] => {
      const context = ctx as { related: RelatedKind | null } | null;
      return [
        { id: 'edit', label: 'Edit', cta: () => handleEdit(context?.related) },
        { id: 'delete', label: 'Delete', cta: handleDelete },
      ];
    },
  });
};

// Without lazy loading (no loadContext) -- actions are built immediately
const useSimpleActionsLazy = (resource: MyKind): LazyActionHookResult<Action> => {
  return useLazyActionMenu({
    buildActions: () => [
      { id: 'download', label: 'Download YAML', cta: () => downloadYaml(resource) },
    ],
  });
};

// Compose multiple lazy action hooks into a single menu
const useAllActionsLazy = (resource: MyKind): LazyActionHookResult<Action> => {
  const myActions = useMyActionsLazy(resource);
  const simpleActions = useSimpleActionsLazy(resource);
  return composeLazyActions(myActions, simpleActions);
};

// Usage in component
const [actions, onOpen] = useAllActionsLazy(resource);
<ActionMenu actions={actions} onOpen={onOpen} />
```

### useVisibleColumns

Session-storage-backed column visibility state:

```ts
import { useVisibleColumns } from '~/hooks/useVisibleColumns';

const [visibleColumns, setVisibleColumns] = useVisibleColumns(
  'my-feature-columns',
  DEFAULT_VISIBLE_COLUMNS,
);
```

## State Management Summary

| Data Type | Tool | Location |
|---|---|---|
| K8s resources (live) | `useK8sWatchResource` | `src/k8s/hooks/` |
| K8s resources (archived) | `useK8sAndKarchResources` | `src/hooks/` |
| REST API data | `useQuery` / `useInfiniteQuery` | `@tanstack/react-query` |
| Mutations | `K8sQueryCreateResource` etc. | `src/k8s/query/fetch.ts` |
| Global client state | Zustand (`useTaskStore`) | `src/utils/task-store.ts` |
| Feature flags | `useIsOnFeatureFlag` | `src/feature-flags/hooks` |
| URL filter state | `useSearchParamBatch` | `src/hooks/useSearchParam` |
| Persistent preferences | `useLocalStorage` | `src/shared/hooks/useLocalStorage` |
| Namespace context | `useNamespace` | `src/shared/providers/Namespace/` |
| RBAC permissions | `useAccessReviewForModel` | `src/utils/rbac` |
