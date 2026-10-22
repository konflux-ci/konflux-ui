import { useQuery } from '@tanstack/react-query';
import { useIsOnFeatureFlag } from '~/feature-flags/hooks';
import { PipelineRunKind } from '~/types';
import { KUEUE_QUEUE_NAME_LABEL, DEFAULT_KUEUE_POLLING_INTERVAL_MS } from './const';
import { fetchKueuePendingWorkloads } from './kueue-fetch';
import { getKueueQueuePositionForPipelineRun } from './kueue-utils';
import { KueueQueuePosition } from './types';

export interface UseKueueQueuePositionForPipelineRunResult {
  /** Queue position for this PipelineRun, `undefined` when unavailable (flag off, no label, not pending, or error). */
  queuePosition: KueueQueuePosition | undefined;
  isLoading: boolean;
  /** Fetch error, if any. Non-fatal — callers should fall back to the plain "Queued" status. */
  error: unknown;
}

/**
 * Returns the Kueue queue position for a single PipelineRun.
 *
 * Reads the `kueue.x-k8s.io/queue-name` label from the PipelineRun to determine
 * which LocalQueue to poll, then matches the PipelineRun back to its pending workload
 * via `metadata.ownerReferences`. Designed to be called once per PipelineRun row in a
 * list view — rows sharing the same queue name share one network poll via React Query
 * dedup (query key: `['kueue-pending-workloads', namespace, queueName]`).
 *
 * Self-guards on the `kueue-queue-position` feature flag (which itself is guarded by
 * the `isKueueAvailable` condition), so it is safe to call unconditionally — it is a
 * no-op (no network calls) when the flag is off, the namespace is missing, or the
 * PipelineRun has no queue label.
 *
 * When the feature flag is off, the PipelineRun has no queue label, or the fetch
 * errors, `queuePosition` is `undefined` (graceful fallback).
 */
export const useKueueQueuePositionForPipelineRun = (
  namespace: string | undefined,
  pipelineRun: PipelineRunKind,
  pollingIntervalMs: number = DEFAULT_KUEUE_POLLING_INTERVAL_MS,
): UseKueueQueuePositionForPipelineRunResult => {
  const isKueueQueuePositionEnabled = useIsOnFeatureFlag('kueue-queue-position');
  const queueName = pipelineRun.metadata?.labels?.[KUEUE_QUEUE_NAME_LABEL];
  const pipelineRunName = pipelineRun.metadata?.name;
  const enabled = isKueueQueuePositionEnabled && !!namespace && !!queueName;

  const { data, isLoading, error } = useQuery({
    queryKey: ['kueue-pending-workloads', namespace, queueName],
    queryFn: () => fetchKueuePendingWorkloads(namespace ?? '', queueName ?? ''),
    enabled,
    refetchInterval: enabled ? pollingIntervalMs : false,
    retry: false,
  });

  const queuePosition =
    enabled && data && pipelineRunName
      ? getKueueQueuePositionForPipelineRun(data.items, pipelineRunName)
      : undefined;

  return { queuePosition, isLoading: enabled && isLoading, error };
};
