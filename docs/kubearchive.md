# 📦 KubeArchive — Tech Docs

This document explains how our **dual‑source** Kubernetes resource system works, how data flows between cluster and archive, and how to fetch resources in daily development.

---

## 1. What lives where?

```
src/
  kubearchive/
    fetch-utils.ts    # path prefix, direct query functions
    hooks.ts          # React hooks for archive data (infinite queries)
    resource-utils.ts # fallback utility (cluster → archive)
  hooks/
    useK8sAndKarchResources.ts  # main integration hook (combines both sources)
```

*Archive requests route through **plugins/kubearchive** path prefix to the backend plugin.*

**Key files breakdown:**
- `fetch-utils.ts` — Core utilities that add the kubearchive path prefix and provide direct query functions
- `hooks.ts` — Archive-specific React hooks with infinite pagination support
- `resource-utils.ts` — Smart fallback logic that tries cluster first, then archive on 404
- `useK8sAndKarchResources.ts` — Main hook that combines both sources with deduplication

---

## 2. Data flow & fallback strategy

| Step | Source           | Example                              | Notes                                        |
| ---- | ---------------- | ------------------------------------ | -------------------------------------------- |
| 1    | **Live Cluster** | `useK8sWatchResource` with WebSocket | Real-time data, current state.               |
| 2    | **Archive**      | `useKubearchiveListResourceQuery`    | Historical data, paginated.                  |
| 3    | **Deduplication**| UID or name-namespace matching      | Cluster data takes precedence.               |

**Single resource fallback does two things:**

1. Tries cluster first with `k8sQueryGetResource`.
2. On 404 error, falls back to `kubearchiveQueryGetResource`.

**List resource combination does three things:**

1. Fetches from both cluster and archive simultaneously.
2. Deduplicates based on resource UIDs or `name-namespace`.
3. Returns combined array with cluster data taking priority.

---

### Deduplication cheat‑sheet

* **Primary key**: `metadata.uid` when available.
* **Fallback key**: `${name}-${namespace}` combination.
* **Priority**: Cluster data always wins over archive data.
* **Performance**: Uses JavaScript Set for O(1) lookup during deduplication.

> Archive resources only get added if their ID doesn't exist in cluster data.

---

## 3. Fetching resources with archive support

1. **List resources (most common)**

   ```tsx
   import { useK8sAndKarchResources } from '~/hooks/useK8sAndKarchResources';

   const { 
     data,           // combined deduplicated array
     isLoading,      // true if either source is loading
     hasError,       // true if either source has error
     clusterData,    // raw cluster data
     archiveData,    // raw archive pages
     hasNextPage,    // archive pagination
     fetchNextPage   // load more archive data
   } = useK8sAndKarchResources(
     {
       groupVersionKind: ReleaseGroupVersionKind,
       namespace: 'default',
       isList: true,
       selector: { matchLabels: { app: 'web' } }  // optional filtering
     },
     ReleaseModel
   );
   ```

2. **Single resource with fallback**

   ```tsx
   import { useK8sAndKarchResource } from '~/hooks/useK8sAndKarchResources';

   const { 
     data: release,  // the resource or undefined
     isLoading,      // fetch in progress
     error,          // any error encountered
     isError         // convenience boolean
   } = useK8sAndKarchResource({
     model: ReleaseModel,
     queryOptions: { ns: 'default', name: 'my-release' }
   });
   
   // Will try cluster first, then archive if 404
   ```

3. **Archive-only queries**

   ```tsx
   import { useKubearchiveListResourceQuery } from '~/kubearchive/hooks';

   const { 
     data,               // { pages: [[resource1, resource2], [resource3]] }
     hasNextPage,        // more data available
     fetchNextPage,      // function to load next page
     isFetchingNextPage, // loading state for pagination
     isLoading,          // initial loading state
     error               // any errors
   } = useKubearchiveListResourceQuery(
     { 
       groupVersionKind: ReleaseModel, 
       namespace: 'prod',
       fieldSelector: 'status.phase=Running'  // server-side filtering
     },
     DeploymentModel
   );

   // Flatten pages to get all resources
   const allDeployments = data?.pages.flat() || [];
   ```

4. **Direct utility functions**

   ```tsx
   import { fetchResourceWithK8sAndKubeArchive } from '~/kubearchive/resource-utils';

   // Promise-based fallback (not a hook)
   const release = await fetchResourceWithK8sAndKubeArchive({
     model: ReleaseModel,
     queryOptions: { ns: 'default', name: 'deleted-release' }
   });
   ```

---

## 4. Hook & utility API

```ts
// main integration hooks
useK8sAndKarchResources(resourceInit, model, queryOptions?, options?);  // combines cluster + archive
useK8sAndKarchResource(resourceInit, options?, enabled?);               // single resource fallback

// archive-only hooks  
useKubearchiveListResourceQuery(resourceInit, model);  // infinite pagination
useKubearchiveGetResourceQuery(resourceInit, model, queryOptions?, options?);   // single archive resource

// direct utilities
fetchResourceWithK8sAndKubeArchive(resourceInit, options?);      // Promise-based fallback
withKubearchivePathPrefix(options);                              // adds path prefix
kubearchiveQueryGetResource(resourceInit, options?);             // direct archive fetch
kubearchiveQueryListResource(resourceInit, options?);           // direct archive list
kubearchiveQueryListResourceItems(resourceInit, options?);      // archive list (items only),  removes metadata from response
```

**Return types:**
- List hooks return arrays of resources with pagination utilities
- Single resource hooks return the resource object or undefined
- All hooks provide separate loading/error states for each source
- Archive queries support infinite pagination with continue tokens

---

## 5. Error handling patterns

**Graceful degradation:**
```tsx
const { 
  data, 
  clusterError, 
  archiveError, 
  hasError,
  clusterLoading,
  archiveLoading 
} = useK8sAndKarchResources(init, model);

if (clusterError && archiveError) {
  return <ErrorState>Both sources unavailable</ErrorState>;
}

if (clusterError && !archiveError) {
  return (
    <div>
      <Warning>Live data unavailable, showing archived data</Warning>
      <ResourceList resources={data} showArchiveIndicator />
    </div>
  );
}
```

**Partial loading states:**
```tsx
const { clusterLoading, archiveLoading, isLoading } = useK8sAndKarchResources(init, model);

return (
  <div>
    {clusterLoading && <Spinner label="Loading cluster data..." />}
    {archiveLoading && <Spinner label="Loading archive data..." />}
    {!isLoading && <ResourceTable resources={data} />}
  </div>
);
```




## 6. Common patterns

**Resource history view:**
```tsx
const { data, clusterData, archiveData } = useK8sAndKarchResources(init, model);

const currentCount = clusterData?.length || 0;
const historicalCount = archiveData?.flat().length || 0;

return (
  <div>
    <Tabs>
      <Tab label={`Current (${currentCount})`}>
        <ResourceTable resources={clusterData} />
      </Tab>
      <Tab label={`Historical (${historicalCount})`}>
        <ResourceTable resources={archiveData?.flat()} showTimestamps />
      </Tab>
      <Tab label={`Combined (${data.length})`}>
        <ResourceTable resources={data} showSourceIndicator />
      </Tab>
    </Tabs>
  </div>
);
```

**Conditional querying:**
```tsx
const [enabled, setEnabled] = useState(false);

const { data } = useK8sAndKarchResource(
  resourceInit,
  undefined,
  enabled  // only fetch when enabled is true
);
```

**Infinite scroll integration:**
```tsx
const { data, hasNextPage, fetchNextPage, isFetchingNextPage } = 
  useKubearchiveListResourceQuery(init, model);

const handleScroll = useCallback(() => {
  if (hasNextPage && !isFetchingNextPage) {
    fetchNextPage();
  }
}, [hasNextPage, isFetchingNextPage, fetchNextPage]);
```

---

Happy archiving! 📚 