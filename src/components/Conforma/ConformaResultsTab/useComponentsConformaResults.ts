import * as React from 'react';
import { useQueries, useQueryClient } from '@tanstack/react-query';
import { PipelineRunLabel } from '~/consts/pipelinerun';
import { useIsOnFeatureFlag } from '~/feature-flags/hooks';
import { useTaskRunsV2 } from '~/hooks/useTaskRunsV2';
import { logger } from '~/monitoring/logger';
import type { TaskRunKind } from '~/types';
import type { ComponentKind } from '~/types/component';
import type { ComponentConformaResult, ConformaRefreshState } from '~/types/conforma';
import { TektonResourceLabel } from '~/types/coreTekton';
import {
  fetchLatestSecurityTaskRunForComponent,
  filterInvalidImageConformaRows,
  resolveConformaResultFromTaskRun,
} from './conforma-fetchers';
import { buildConformaSecurityTaskRunWatchOptions } from './conforma-taskrun-query';

/** Multiplier for per-component TaskRun headroom in the bounded batch (arch variants, retries). */
const BATCH_LIMIT_PER_COMPONENT = 3;
/** Minimum batch size so the first fetch stays bounded before components finish loading. */
const BATCH_LIMIT_FLOOR = 10;

export const NO_OP_REFRESH: ConformaRefreshState = {
  lastFetchedAt: 0,
  isRefreshing: false,
  onRefresh: () => undefined,
};

export type ComponentConformaData = {
  results: ComponentConformaResult[];
  pipelineRunName?: string;
};

export type UseComponentsConformaResultsReturn = {
  conformaByComponent: Map<string, ComponentConformaData>;
  mergedLatestPerComponent: Map<string, TaskRunKind>;
  taskRunsLoaded: boolean;
  logsSettled: boolean;
  fillInSettled: boolean;
  taskRunsError: unknown;
  aggregatedLogError: unknown;
  refresh: ConformaRefreshState;
};

export function pickNewest(existing: TaskRunKind | undefined, candidate: TaskRunKind): TaskRunKind {
  if (!existing) return candidate;
  const candidateTs = candidate.metadata?.creationTimestamp ?? '';
  const existingTs = existing.metadata?.creationTimestamp ?? '';
  if (candidateTs !== existingTs) {
    return candidateTs > existingTs ? candidate : existing;
  }
  const candidateName = candidate.metadata?.name ?? '';
  const existingName = existing.metadata?.name ?? '';
  return candidateName > existingName ? candidate : existing;
}

/**
 * Shared hook that fetches Conforma security TaskRuns and their log results
 * for a given list of components.
 *
 * Both useApplicationConformaResults (single-app view) and
 * useWorkspaceConformaViolations (workspace-wide card) delegate to this hook.
 * Cache keys are stable across both consumers, so navigating from the Issues
 * Dashboard into an application's Conforma Results tab reuses cached log data
 * instead of re-fetching.
 *
 * @param namespace  Kubernetes namespace
 * @param components List of ComponentKind resources to query. Pass an empty
 *                   array while components are still loading.
 * @param options    Optional applicationName to scope the TaskRun batch watch
 *                   to a single application; omit for workspace-wide queries.
 */
export const useComponentsConformaResults = (
  namespace: string,
  components: ComponentKind[],
  options?: { applicationName?: string },
): UseComponentsConformaResultsReturn => {
  const isKubearchiveLogsEnabled = useIsOnFeatureFlag('kubearchive-logs');
  const isKubearchiveTaskRunsEnabled = useIsOnFeatureFlag('taskruns-kubearchive');
  const applicationName = options?.applicationName;

  const batchLimit = React.useMemo(
    () => Math.max(components.length * BATCH_LIMIT_PER_COMPONENT, BATCH_LIMIT_FLOOR),
    [components.length],
  );

  const watchOptions = React.useMemo(
    () =>
      namespace?.length
        ? buildConformaSecurityTaskRunWatchOptions(namespace, applicationName)
        : null,
    [namespace, applicationName],
  );

  const [securityTaskRuns, taskRunsLoaded, taskRunsError, , , taskRunWatchMeta] = useTaskRunsV2(
    namespace,
    watchOptions ? { selector: watchOptions.selector, limit: batchLimit } : undefined,
    { staleTime: Infinity },
  );

  const queryClient = useQueryClient();
  const { refetch: refetchTaskRuns } = taskRunWatchMeta;
  const onRefresh = React.useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: ['conforma-fillin', namespace] });
    void refetchTaskRuns();
  }, [queryClient, namespace, refetchTaskRuns]);

  const refresh = React.useMemo(
    (): ConformaRefreshState => ({
      lastFetchedAt: taskRunWatchMeta.dataUpdatedAt,
      isRefreshing: taskRunWatchMeta.isFetching,
      onRefresh,
    }),
    [taskRunWatchMeta.dataUpdatedAt, taskRunWatchMeta.isFetching, onRefresh],
  );

  const latestPerComponent = React.useMemo((): Map<string, TaskRunKind> => {
    const newestByComp = new Map<string, TaskRunKind>();
    for (const tr of securityTaskRuns ?? []) {
      const comp = tr.metadata?.labels?.[PipelineRunLabel.COMPONENT];
      const trName = tr.metadata?.name;
      if (!comp || !trName) continue;
      newestByComp.set(comp, pickNewest(newestByComp.get(comp), tr));
    }
    return newestByComp;
  }, [securityTaskRuns]);

  // Fill-in: fetch latest TaskRun for components missing from the batch.
  // Each component uses its own spec.application so the cache key
  // ['conforma-fillin', namespace, componentName, appName, isKubearchiveTaskRunsEnabled]
  // is identical to what useApplicationConformaResults would produce for the
  // same component — ensuring cross-consumer cache hits.
  const missingComponents = React.useMemo(() => {
    if (!taskRunsLoaded || components.length === 0) return [];
    return components.filter((c) => {
      const name = c.metadata?.name;
      return !!name && !latestPerComponent.has(name);
    });
  }, [components, taskRunsLoaded, latestPerComponent]);

  const { fillInTaskRuns, fillInSettled, fillInErrorKey } = useQueries({
    queries: missingComponents.map((comp) => {
      const componentName = comp.metadata.name;
      const appName = comp.spec.application;
      return {
        queryKey: [
          'conforma-fillin',
          namespace,
          componentName,
          appName,
          isKubearchiveTaskRunsEnabled,
        ] as const,
        queryFn: () =>
          fetchLatestSecurityTaskRunForComponent(
            namespace,
            appName,
            componentName,
            isKubearchiveTaskRunsEnabled,
          ),
        staleTime: Infinity,
        enabled: !!namespace && missingComponents.length > 0,
      };
    }),
    combine: (results) => {
      const errors = results
        .filter((q) => q.isError)
        .map((q) => q.error)
        .filter((error): error is Error => error != null);
      return {
        fillInTaskRuns: results.map((q) => q.data).filter((tr): tr is TaskRunKind => tr != null),
        fillInSettled: results.every((q) => !q.isLoading),
        fillInErrorKey: errors.map((e) => e.message).join('\0'),
      };
    },
  });

  React.useEffect(() => {
    if (!fillInErrorKey) return;
    for (const message of fillInErrorKey.split('\0')) {
      logger.warn('useComponentsConformaResults: fill-in query failed', { message });
    }
  }, [fillInErrorKey]);

  const mergedLatestPerComponent = React.useMemo((): Map<string, TaskRunKind> => {
    if (fillInTaskRuns.length === 0) return latestPerComponent;
    const merged = new Map(latestPerComponent);
    for (const tr of fillInTaskRuns) {
      const comp = tr.metadata?.labels?.[PipelineRunLabel.COMPONENT];
      if (!comp) continue;
      merged.set(comp, pickNewest(merged.get(comp), tr));
    }
    return merged;
  }, [latestPerComponent, fillInTaskRuns]);

  const latestTaskRuns = React.useMemo(
    () => Array.from(mergedLatestPerComponent.values()),
    [mergedLatestPerComponent],
  );

  const { logData, allSettled: logsSettled, aggregatedLogError } = useQueries({
    queries: latestTaskRuns.map((tr) => ({
      queryKey: ['conforma-log', namespace, tr.metadata?.uid, isKubearchiveLogsEnabled] as const,
      queryFn: () => resolveConformaResultFromTaskRun(namespace, tr, isKubearchiveLogsEnabled),
      staleTime: Infinity,
      enabled: !!namespace && !!tr.metadata?.uid,
    })),
    combine: (results) => ({
      logData: results.map((q) => q.data),
      allSettled: results.every((q) => !q.isLoading),
      aggregatedLogError:
        results.length > 0 && results.some((q) => q.isError)
          ? results.find((q) => q.isError)?.error
          : undefined,
    }),
  });

  React.useEffect(() => {
    if (aggregatedLogError) {
      logger.warn('useComponentsConformaResults: log fetch failed', { error: aggregatedLogError });
    }
  }, [aggregatedLogError]);

  const conformaByComponent = React.useMemo((): Map<string, ComponentConformaData> => {
    const map = new Map<string, ComponentConformaData>();
    latestTaskRuns.forEach((tr, idx) => {
      const comp = tr.metadata?.labels?.[PipelineRunLabel.COMPONENT];
      if (!comp) return;
      const data = logData[idx];
      if (!data) return;
      const pipelineRunName = tr.metadata?.labels?.[TektonResourceLabel.pipelinerun];
      map.set(comp, {
        results: filterInvalidImageConformaRows(data.components ?? []),
        pipelineRunName,
      });
    });
    return map;
  }, [latestTaskRuns, logData]);

  return {
    conformaByComponent,
    mergedLatestPerComponent,
    taskRunsLoaded,
    logsSettled,
    fillInSettled,
    taskRunsError,
    aggregatedLogError,
    refresh,
  };
};
