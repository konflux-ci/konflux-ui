import { useQueries } from '@tanstack/react-query';
import { useIsOnFeatureFlag } from '~/feature-flags/hooks';
import { DEFAULT_KUEUE_POLLING_INTERVAL_MS } from './const';
import { fetchKueuePendingWorkloads } from './kueue-fetch';
import { buildQueuePositionsByPipelineRun } from './kueue-utils';
import { KueueQueuePositionsByPipelineRun } from './types';

export interface UseKueuePendingWorkloadsResult {
  /** Lookup map: PipelineRun name -> its Kueue queue position info. Empty when unavailable. */
  queuePositionsByPipelineRun: KueueQueuePositionsByPipelineRun;
  isLoading: boolean;
  /** First error encountered across the per-queue requests, if any. Non-fatal -- callers should
   * fall back to the existing plain "Queued" status rather than surfacing this to the user. */
  error: unknown;
}

/**
 * Polls the Kueue visibility API for the given LocalQueue names in a namespace and
 * returns a lookup map from PipelineRun name to its queue position info.
 *
 * Queries once per unique queue name (not once per PipelineRun), use `getKueueQueueNames` from `./kueue-utils` to derive
 * `queueNames` from a list of PipelineRuns. Each returned workload is matched back to its PipelineRun via `metadata.ownerReferences`.
 *
 * Self-guards on the `kueue-queue-position` feature flag (which itself is guarded by the
 * `isKueueAvailable` condition), so it is safe to call unconditionally -- it is a no-op
 * (no network calls, empty map) when the flag is off or Kueue isn't available on the cluster.
 * Per-queue failures (e.g. 403 on clusters not yet migrated to the Konflux operator) are
 * swallowed into `error` and simply omit that queue's workloads from the result map.
 */
export const useKueuePendingWorkloads = (
  namespace: string | undefined,
  queueNames: string[],
  pollingIntervalMs: number = DEFAULT_KUEUE_POLLING_INTERVAL_MS,
): UseKueuePendingWorkloadsResult => {
  const isKueueQueuePositionEnabled = useIsOnFeatureFlag('kueue-queue-position');
  const enabled = isKueueQueuePositionEnabled && !!namespace && queueNames.length > 0;

  return useQueries({
    queries: queueNames.map((queueName) => ({
      queryKey: ['kueue-pending-workloads', namespace, queueName],
      queryFn: () => fetchKueuePendingWorkloads(namespace ?? '', queueName),
      enabled,
      refetchInterval: enabled ? pollingIntervalMs : false,
      retry: false,
    })),
    combine: (results) => ({
      queuePositionsByPipelineRun: buildQueuePositionsByPipelineRun(
        results.map((result) => result.data?.items ?? []),
      ),
      isLoading: enabled && results.some((result) => result.isLoading),
      error: results.find((result) => result.error)?.error,
    }),
  });
};
