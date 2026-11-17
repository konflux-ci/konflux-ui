# ⏳ Kueue — Tech Docs

This document explains how the UI reads **Kueue queue visibility** data, how a PipelineRun is matched to its pending workload, and how to consume queue position and priority in daily development.

> **Scope.** This covers the Kueue **data layer** in `src/kueue` (plus the model, types, condition, and feature flag it depends on). The list and details presentation is a separate layer; it should consume the hook and utilities below rather than calling the visibility API directly.

---

## 1. What lives where?

```text
src/
  kueue/
    conditional-checks.ts  # isKueueAvailable condition (API discovery)
    const.ts               # API path, queue label, polling interval, condition TTL
    kueue-hooks.ts         # useKueueQueuePositionForPipelineRun (polling hook)
    kueue-utils.ts         # pending workload -> KueueQueuePosition matching
  models/
    kueue.ts               # KueueLocalQueueModel + GVK
  types/
    kueue.ts               # KueuePendingWorkload, summary, KueueQueuePosition
  feature-flags/
    conditions.ts          # KUEUE condition key
    flags.ts               # kueue-queue-position (WIP)
  utils/
    plr-status-config.tsx  # derives `Queued` for Kueue-labeled pending PipelineRuns
```

Kueue traffic goes through the **Kubernetes API server** at `apis/visibility.kueue.x-k8s.io/v1beta2`; no UI backend plugin is involved.

**Key files breakdown:**

- `conditional-checks.ts` — probes the API group discovery endpoint and exposes the `isKueueAvailable` condition.
- `const.ts` — path constants, the `kueue.x-k8s.io/queue-name` label, the 60s polling interval, and the 30s condition TTL.
- `kueue-hooks.ts` — the React entry point: polls one LocalQueue and resolves one PipelineRun's queue position.
- `kueue-utils.ts` — pure matching logic from pending workloads to a `KueueQueuePosition`, plus the shared `isKueueQueueWaitVisible` display gate.
- `models/kueue.ts` / `types/kueue.ts` — LocalQueue model/GVK and the visibility API response shapes.
- `utils/plr-status-config.tsx` — derives the `Queued` status that queue UI should key off.

---

## 2. How Kueue visibility works

Kueue and tekton-kueue are deployed separately from the Konflux operator, so not every cluster has them. When they are present:

1. **The admission webhook labels the PipelineRun.** tekton-kueue adds `kueue.x-k8s.io/queue-name: <local-queue>` to every PipelineRun it admits. A namespace can have more than one LocalQueue; this label is the only reliable way to know which one a run belongs to.
2. **Kueue creates a pending Workload.** Until ClusterQueue quota is available, the Workload stays pending.
3. **The UI polls the visibility API** for that LocalQueue:

   ```text
   GET /apis/visibility.kueue.x-k8s.io/v1beta2/namespaces/{namespace}/localqueues/{queueName}/pendingworkloads
   ```

4. **The UI matches the PipelineRun to its workload** through `metadata.ownerReferences`, requiring both `kind: PipelineRun` and the PipelineRun `uid`. Matching by UID (not name) prevents a recreated PipelineRun from inheriting a stale queue position.

**Data flow:**

| Step | Source             | What is used                                       | Notes                                            |
| ---- | ------------------ | -------------------------------------------------- | ------------------------------------------------ |
| 1    | PipelineRun labels | `kueue.x-k8s.io/queue-name`                        | Set by the tekton-kueue admission webhook.       |
| 2    | Visibility API     | `.../localqueues/{name}/pendingworkloads`          | No watch support; the UI polls.                  |
| 3    | Pending workload   | `metadata.ownerReferences`                         | Matched by `kind` + PipelineRun `uid`.           |
| 4    | `KueueQueuePosition` | `priority`, `localQueueName`, both positions     | Positions are 0-based.                           |

### Positions are 0-based

`positionInClusterQueue` and `positionInLocalQueue` come straight from the API, where the head of the queue is `0`. Add 1 for display.

- **Cluster position** is the globally meaningful number: the Konflux quota is cluster-wide.
- **Local position** is only within the namespace's LocalQueue. Use it for per-namespace context, not as the primary "position in queue".

### Priority

`priority` from the payload is numeric. The `kueue.x-k8s.io/priority-class` label (`KUEUE_PRIORITY_CLASS_LABEL`) names the WorkloadPriorityClass (for example, `konflux-pre-merge-test`). Show the class name next to the number when the label is present.

### What makes a run "Queued"?

`PIPELINE_RUN_STATUS_REGISTRY` in `src/utils/plr-status-config.tsx` derives `Queued` when `spec.status` is `PipelineRunPending` **and** the run has either:

- `pipelinesascode.tekton.dev/state=queued` (PAC-only queued run), or
- `kueue.x-k8s.io/queue-name` (Kueue-admitted run).

The queue label remains after admission, so **the label alone does not mean the run is still waiting**. Gate queue UI on the derived `Queued` status (and the label) rather than on the label alone.

---

## 3. Reading the queue position

```tsx
import { useKueueQueuePositionForPipelineRun } from '~/kueue/kueue-hooks';

const { queuePosition, isLoading, error, hasPayload } = useKueueQueuePositionForPipelineRun(
  namespace, // from useNamespace()
  pipelineRun, // the PipelineRunKind row/resource
);

const displayPosition = queuePosition
  ? queuePosition.positionInClusterQueue + 1
  : undefined;
```

`queuePosition` is `undefined` when the flag is off, the namespace is missing, the PipelineRun has no queue label, `spec.status` is not `PipelineRunPending`, no pending-workloads payload has arrived yet, or the run is not in the payload (for example, it was just admitted). A failed **refetch** keeps the last known position because the previous payload is retained.

### Self-guarding and no-op behavior

The hook is safe to call unconditionally, including once per row in a list. It makes **no network request** when:

- the `kueue-queue-position` feature flag is off, or
- the namespace is missing, or
- the PipelineRun has no `kueue.x-k8s.io/queue-name` label, or
- `spec.status` is not `PipelineRunPending`.

These checks happen before the underlying query is enabled, so a list containing no pending Kueue runs causes zero Kueue traffic.

> `watch: false` is intentional: the visibility API does not support watch. Freshness comes from `refetchInterval` (`DEFAULT_KUEUE_POLLING_INTERVAL_MS`, 60s).

> The pending check is what stops finished runs from polling: the queue label persists after admission. Gate rendering on the derived `Queued` status too, so a run that leaves the queue does not keep showing stale queue information.

---

## 4. Hook & utility API

```ts
// React
useKueueQueuePositionForPipelineRun(namespace, pipelineRun, pollingIntervalMs?);
useIsKueueAvailable();

// Pure/async helpers
getKueueQueuePositionForPipelineRun(items, pipelineRunUid);
isKueueQueueWaitVisible(pipelineRun, isFlagOn);
checkIfKueueIsAvailable();
isKueueAvailable();
```

**`useKueueQueuePositionForPipelineRun` return value:**

```ts
interface UseKueueQueuePositionForPipelineRunResult {
  queuePosition: KueueQueuePosition | undefined;
  isLoading: boolean;
  error: unknown;
  hasPayload: boolean;
}
```

| Field           | Meaning                                                                                              |
| --------------- | ---------------------------------------------------------------------------------------------------- |
| `queuePosition` | `{ priority, localQueueName, positionInClusterQueue, positionInLocalQueue }`, or `undefined`.        |
| `isLoading`     | `true` only while the request is enabled and in flight.                                              |
| `error`         | Fetch error. Non-fatal — callers should fall back to the plain `Queued` status.                      |
| `hasPayload`    | `true` once a pending-workloads payload has arrived, even if this run is not in it.                  |

**Types (`src/types/kueue.ts`):**

```ts
type KueueQueuePosition = Pick<
  KueuePendingWorkloadKind,
  'priority' | 'localQueueName' | 'positionInClusterQueue' | 'positionInLocalQueue'
>;
```

`KueuePendingWorkloadKind` also carries `metadata` (name, creation timestamp, owner references), but the UI exposes only the queue fields.

---

## 5. Feature flag and condition

Kueue support is **opt-in and cluster-gated**.

### `isKueueAvailable` (condition)

- Defined in `src/kueue/conditional-checks.ts`, registered in `src/registers.ts`.
- `checkIfKueueIsAvailable()` calls `GET /apis/visibility.kueue.x-k8s.io/v1beta2`; success means the API group is registered on the cluster.
- The result is cached for `KUEUE_CONDITION_TTL_MS` (30s) so a transient network failure cannot permanently disable Kueue features.

### `kueue-queue-position` (feature flag)

- Defined in `src/feature-flags/flags.ts`; `status: 'wip'`, `defaultEnabled: false`.
- Guard: `allOf: ['isKueueAvailable']`; failure reason: "Kueue is not available on this cluster".
- Visible in the feature flag panel.
- Read in components with `useIsOnFeatureFlag('kueue-queue-position')`.

Because the hook checks the flag internally, callers do not need an extra guard for network safety — but they **do** need it for rendering decisions (for example, whether to reserve space for the queue position line).

---

## 6. Error handling and graceful degradation

The Kueue data layer is deliberately non-blocking:

- `retry: false` — a failing endpoint is not hammered.
- `error` is returned rather than thrown; callers should render the normal `Queued` status without position/priority whenever `queuePosition` is `undefined`.
- A failed refetch keeps the last known position: TanStack Query retains the previous payload, so `error` may be set while `queuePosition` is still populated.
- `hasPayload` distinguishes "still loading / never loaded" from "loaded, but this run is not queued": it is `true` once any pending-workloads payload arrives, even if the run is absent.
- A missing position is normal: the run may have just been admitted, or it may belong to another queue.
- `403` is expected when the user cannot read the visibility sub-resource; treat it like any other fetch error and fall back.

```tsx
const { queuePosition } = useKueueQueuePositionForPipelineRun(namespace, pipelineRun);

// Always render the status; queue info is progressive enhancement.
const positionLabel = queuePosition
  ? `position#${queuePosition.positionInClusterQueue + 1}`
  : undefined;

// Render `positionLabel` under the status word when it is defined.
```

---

## 7. Common patterns

### One poll per queue

The hook builds the TanStack Query key from the K8s request — LocalQueue name, namespace, and `pathSuffix`. Rows sharing the same LocalQueue share one cache entry. Call the hook once per PipelineRun row; do not batch or pre-aggregate requests yourself.

### Keep the queue label gate

Do not show Kueue UI for every `PipelineRunPending` run. PAC-only queued runs and clusters without Kueue must keep the current behavior. `isKueueQueueWaitVisible` is the shared gate — flag on, queue label present, and derived status `Queued`:

```tsx
import { isKueueQueueWaitVisible } from '~/kueue/kueue-utils';

const showQueueInfo = isKueueQueueWaitVisible(pipelineRun, isFlagOn);
```

---

## 8. Adding a new Kueue-powered view

1. Read the flag (`useIsOnFeatureFlag('kueue-queue-position')`) if the view needs to reserve space or load extra data.
2. Call `useKueueQueuePositionForPipelineRun(namespace, pipelineRun)` for each run.
3. Gate rendering with `isKueueQueueWaitVisible(pipelineRun, isFlagOn)` — flag, queue label, and derived `Queued`.
4. Treat `undefined` as "show the plain `Queued` status" — never block the status on Kueue.
5. Use `hasPayload` to distinguish a loading placeholder from "no position available".
6. Add tests for the flag-off, label-absent, not-pending, matching, and error paths.

