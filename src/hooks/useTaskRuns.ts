import * as React from 'react';
import { TaskRunKind, TektonResourceLabel } from '~/types';
import { useTaskRuns as useTaskRuns2 } from './usePipelineRuns';
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

  const sortFunction = (a: TaskRunKind, b: TaskRunKind) => {
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

    // 3. Final fallback → sort by name when there is no startTime or completed time.
    return compareByName(a, b);
  };

  // @ts-expect-error: toSorted might not be in TS yet
  if (typeof taskRuns.toSorted === 'function') {
    // @ts-expect-error: toSorted might not be in TS yet
    return taskRuns.toSorted(sortFunction);
  }
  return [...taskRuns].sort(sortFunction);
};

export const useTaskRuns = (
  namespace: string,
  pipelineRunName: string,
  taskName?: string,
): [TaskRunKind[], boolean, unknown] => {
  const [taskRuns, loaded, error] = useTaskRuns2(
    namespace,
    React.useMemo(
      () => ({
        selector: {
          matchLabels: {
            [TektonResourceLabel.pipelinerun]: pipelineRunName,
            ...(taskName ? { [TektonResourceLabel.pipelineTask]: taskName } : {}),
          },
        },
      }),
      [pipelineRunName, taskName],
    ),
  );

  const sortedTaskRuns = React.useMemo(() => sortTaskRunsByTime(taskRuns), [taskRuns]);

  return React.useMemo(() => [sortedTaskRuns, loaded, error], [sortedTaskRuns, loaded, error]);
};

/**
 * Hook for fetching TaskRuns associated with a specific PipelineRun.
 *
 * The `taskruns-kubearchive` feature flag controls which data source is used:
 * - Enabled  → fetches data from KubeArchive
 * - Disabled → falls back to Tekton Results
 *
 * Internally, this hook relies on `useTaskRunsV2(namespace, { selector })`.
 * It is intended to replace `useTaskRuns` in the future.
 *
 *
 * @param namespace - Kubernetes namespace
 * @param pipelineRunName - Name of the pipeline run to fetch TaskRuns for
 * @param taskName - Optional specific task name to filter by
 * @returns Tuple of [taskRuns, loaded, error] sorted by completion time
 */
export const useTaskRunsForPipelineRuns = (
  namespace: string,
  pipelineRunName: string,
  taskName?: string,
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

  const [taskRuns, loaded, error] = useTaskRunsV2(namespace, { selector });

  const sortedTaskRuns = React.useMemo(() => sortTaskRunsByTime(taskRuns), [taskRuns]);

  return React.useMemo(() => [sortedTaskRuns, loaded, error], [sortedTaskRuns, loaded, error]);
};
