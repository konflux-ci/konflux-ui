import * as React from 'react';
import { TaskRunKind, TektonResourceLabel } from '~/types';
import { useTaskRunsV2 } from './useTaskRunsV2';

/**
 * Sorts TaskRuns by completion time, then by start time (newest first)
 */
const sortTaskRunsByTime = (taskRuns?: TaskRunKind[]): TaskRunKind[] => {
  if (!taskRuns?.length) return [];

  const getCompletion = (t: TaskRunKind) =>
    t?.status?.completionTime ? new Date(t.status.completionTime).getTime() : null;

  const getStart = (t: TaskRunKind) =>
    t?.status?.startTime ? new Date(t.status.startTime).getTime() : null;

  const compareByName = (a: TaskRunKind, b: TaskRunKind) =>
    (a?.metadata?.name || '').localeCompare(b?.metadata?.name || '');

  return [...taskRuns].sort((a, b) => {
    const aCompletion = getCompletion(a);
    const bCompletion = getCompletion(b);

    // 1. Both completed → sort by completionTime (newest first)
    if (aCompletion !== null && bCompletion !== null) {
      return bCompletion - aCompletion || compareByName(a, b);
    }
    // One completed → completed comes first
    if (aCompletion !== null) return -1;
    if (bCompletion !== null) return 1;

    // 2. Neither completed → sort by startTime (newest first)
    const aStart = getStart(a);
    const bStart = getStart(b);
    if (aStart !== null && bStart !== null) {
      return bStart - aStart || compareByName(a, b);
    }

    // 3. Final fallback → sort by name
    return compareByName(a, b);
  });
};

/**
 * Hook for fetching TaskRuns for a specific pipeline run.
 *
 * Uses feature flag controlled data source switching:
 * - When 'taskruns-kubearchive' feature flag is enabled, uses KubeArchive data
 * - Otherwise, uses the existing Tekton Results implementation
 *
 * Supports infinite loading and advanced configuration options.
 *
 * @param namespace - Kubernetes namespace
 * @param pipelineRunName - Name of the pipeline run to fetch TaskRuns for
 * @param taskName - Optional specific task name to filter by
 * @param options - Configuration options for the hook
 * @returns Tuple of [taskRuns, loaded, error] sorted by completion time
 */
export const useTaskRuns = (
  namespace: string,
  pipelineRunName: string,
  taskName?: string,
  options?: UseTaskRunsOptions,
): [TaskRunKind[], boolean, unknown] => {
  const selector = React.useMemo(
    () => ({
      matchLabels: {
        [TektonResourceLabel.pipelinerun]: pipelineRunName,
        ...(taskName ? { [TektonResourceLabel.pipelineTask]: taskName } : {}),
      },
    }),
    [pipelineRunName, taskName],
  );

  const [taskRuns, loaded, error] = useTaskRunsV2(namespace, {
    selector,
    enabled: options?.enabled,
    watch: options?.watch,
    limit: options?.limit,
  });

  const sortedTaskRuns = React.useMemo(() => sortTaskRunsByTime(taskRuns), [taskRuns]);

  return React.useMemo(() => [sortedTaskRuns, loaded, error], [sortedTaskRuns, loaded, error]);
};

export interface UseTaskRunsOptions {
  /** Whether the hook should be enabled (default: true) */
  enabled?: boolean;
  /** Whether to watch for real-time updates (default: true) */
  watch?: boolean;
  /** Maximum number of TaskRuns to return */
  limit?: number;
}
