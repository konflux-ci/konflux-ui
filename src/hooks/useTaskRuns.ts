import * as React from 'react';
import { TaskRunKind, TektonResourceLabel } from '~/types';
import { useTaskRuns as useTaskRuns2 } from './usePipelineRuns';
import { useTaskRunsV2 } from './useTaskRunsV2';

/**
 * Sorts TaskRuns by completion time, then by start time (newest first)
 */
const sortTaskRunsByTime = (taskRuns: TaskRunKind[] | undefined): TaskRunKind[] => {
  if (!taskRuns) return [];

  return taskRuns.sort((a, b) => {
    if (a?.status?.completionTime) {
      return b?.status?.completionTime &&
        new Date(a?.status?.completionTime) > new Date(b?.status?.completionTime)
        ? 1
        : -1;
    }
    return b?.status?.startTime || new Date(a?.status?.startTime) > new Date(b?.status?.startTime)
      ? 1
      : -1;
  });
};

/**
 * Hook for fetching TaskRuns for a specific pipeline run.
 * Uses the original Tekton Results implementation.
 *
 * @param namespace - Kubernetes namespace
 * @param pipelineRunName - Name of the pipeline run to fetch TaskRuns for
 * @param taskName - Optional specific task name to filter by
 * @returns Tuple of [taskRuns, loaded, error]
 */
export const useTaskRuns = (
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

  const [taskRuns, loaded, error] = useTaskRuns2(namespace, { selector });

  const sortedTaskRuns = React.useMemo(() => sortTaskRunsByTime(taskRuns), [taskRuns]);

  return React.useMemo(() => [sortedTaskRuns, loaded, error], [sortedTaskRuns, loaded, error]);
};

export interface UseTaskRunsEnhancedOptions {
  /** Whether the hook should be enabled (default: true) */
  enabled?: boolean;
  /** Whether to watch for real-time updates (default: true) */
  watch?: boolean;
  /** Maximum number of TaskRuns to return */
  limit?: number;
}

/**
 * Enhanced TaskRuns hook with feature flag controlled data source switching.
 *
 * When 'taskruns-kubearchive' feature flag is enabled, uses KubeArchive data.
 * Otherwise, uses the existing Tekton Results implementation.
 * Supports infinite loading and maintains full interface compatibility.
 *
 * @param namespace - Kubernetes namespace
 * @param pipelineRunName - Name of the pipeline run to fetch TaskRuns for
 * @param taskName - Optional specific task name to filter by
 * @param options - Configuration options for the hook
 * @returns Tuple of [taskRuns, loaded, error] sorted by completion time
 */
export const useTaskRunsEnhanced = (
  namespace: string,
  pipelineRunName: string,
  taskName?: string,
  options?: UseTaskRunsEnhancedOptions,
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
