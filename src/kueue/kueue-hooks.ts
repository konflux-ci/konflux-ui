import { SucceedConditionReason } from '~/consts/pipelinerun';
import { useIsOnFeatureFlag } from '~/feature-flags/hooks';
import { useK8sWatchResource } from '~/k8s';
import { KueueLocalQueueModel, KueueLocalQueueGroupVersionKind } from '~/models/kueue';
import type { PipelineRunKind } from '~/types';
import type { KueuePendingWorkloadsSummary, KueueQueuePosition } from '~/types/kueue';
import {
  KUEUE_PENDING_WORKLOADS_PATH_SUFFIX,
  KUEUE_QUEUE_NAME_LABEL,
  DEFAULT_KUEUE_POLLING_INTERVAL_MS,
} from './const';
import { getKueueQueuePositionForPipelineRun } from './kueue-utils';

export interface UseKueueQueuePositionForPipelineRunResult {
  /**
   * Queue position for this PipelineRun, `undefined` when unavailable (flag off, no label,
   * not pending, no payload yet, or this run is not in the payload). A failed refetch keeps
   * the last position, because the previous payload is retained.
   */
  queuePosition: KueueQueuePosition | undefined;
  isLoading: boolean;
  /** Fetch error, if any. Non-fatal — callers should fall back to the plain "Queued" status. */
  error: unknown;
  /** True once a pending-workloads payload has arrived, even if it does not contain this run. */
  hasPayload: boolean;
}

/**
 * Returns the Kueue queue position for a single PipelineRun.
 *
 * Reads the `kueue.x-k8s.io/queue-name` label from the PipelineRun to determine
 * which LocalQueue to poll, then matches the PipelineRun back to its pending workload
 * via `metadata.ownerReferences`. Designed to be called once per PipelineRun row in a
 * list view — rows sharing the same queue name share one React Query cache entry.
 *
 * Self-guards on the `kueue-queue-position` feature flag (which itself is guarded by
 * the `isKueueAvailable` condition), so it is safe to call unconditionally — it is a
 * no-op (no network calls) when the flag is off, the namespace is missing, the
 * PipelineRun has no queue label, or `spec.status` is not `PipelineRunPending`. The
 * label stays on the PipelineRun after admission, so the pending check is what stops
 * finished runs from polling.
 *
 * When the feature flag is off, the PipelineRun has no queue label, or the run is not
 * pending, `queuePosition` is `undefined` (graceful fallback).
 */
export const useKueueQueuePositionForPipelineRun = (
  namespace: string,
  pipelineRun: PipelineRunKind,
  pollingIntervalMs: number = DEFAULT_KUEUE_POLLING_INTERVAL_MS,
): UseKueueQueuePositionForPipelineRunResult => {
  const isKueueQueuePositionEnabled = useIsOnFeatureFlag('kueue-queue-position');
  const queueName = pipelineRun.metadata?.labels?.[KUEUE_QUEUE_NAME_LABEL];
  const pipelineRunUid = pipelineRun.metadata?.uid;
  const isPending = pipelineRun.spec?.status === SucceedConditionReason.PipelineRunPending;
  const enabled = isKueueQueuePositionEnabled && !!namespace && !!queueName && isPending;

  const { data, isLoading, error } = useK8sWatchResource<KueuePendingWorkloadsSummary>(
    {
      groupVersionKind: KueueLocalQueueGroupVersionKind,
      name: queueName,
      namespace,
      watch: false,
    },
    KueueLocalQueueModel,
    {
      enabled,
      refetchInterval: enabled ? pollingIntervalMs : false,
      retry: false,
    },
    { pathSuffix: KUEUE_PENDING_WORKLOADS_PATH_SUFFIX },
  );

  const queuePosition =
    enabled && data?.items && pipelineRunUid
      ? getKueueQueuePositionForPipelineRun(data.items, pipelineRunUid)
      : undefined;

  return {
    queuePosition,
    isLoading: enabled && isLoading,
    error,
    hasPayload: enabled && Array.isArray(data?.items),
  };
};
