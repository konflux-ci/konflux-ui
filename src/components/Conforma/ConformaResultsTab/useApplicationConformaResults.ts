import * as React from 'react';
import { useQueries, useQueryClient } from '@tanstack/react-query';
import { PipelineRunLabel } from '~/consts/pipelinerun';
import { useIsOnFeatureFlag } from '~/feature-flags/hooks';
import { useComponents } from '~/hooks/useComponents';
import { useK8sWatchResource } from '~/k8s/hooks/useK8sWatchResource';
import { TaskRunModel } from '~/models/taskruns';
import { useNamespace } from '~/shared/providers/Namespace';
import type { TaskRunKind } from '~/types';
import {
  ComponentConformaResult,
  CONFORMA_RESULT_STATUS,
} from '~/types/conforma';
import type {
  ApplicationConformaResults,
  ComponentConformaStatus,
  ConformaRefreshState,
  ConformaResultRow,
} from '~/types/conforma';
import { TektonResourceLabel } from '~/types/coreTekton';
import {
  filterInvalidImageConformaRows,
  mapConformaResultData,
  resolveConformaResultFromTaskRun,
} from './conforma-fetchers';
import {
  buildConformaSecurityTaskRunQueryKey,
  buildConformaSecurityTaskRunWatchOptions,
} from './conforma-taskrun-query';

const NO_OP_REFRESH: ConformaRefreshState = {
  lastFetchedAt: 0,
  isRefreshing: false,
  hasLiveUpdatesPaused: false,
  onRefresh: () => undefined,
};

const EMPTY_RESULTS: ApplicationConformaResults = {
  componentStatuses: [],
  allResults: [],
  totalComponents: 0,
  totalFailed: 0,
  totalViolations: 0,
  totalWarnings: 0,
  totalSuccesses: 0,
  loaded: false,
  settling: false,
  error: undefined,
  refresh: NO_OP_REFRESH,
};

function aggregateCounts(components: ComponentConformaResult[]) {
  return components.reduce(
    (acc, c) => {
      acc.violationCount += c.violations?.length ?? 0;
      acc.warningCount += c.warnings?.length ?? 0;
      acc.successCount += c.successes?.length ?? 0;
      return acc;
    },
    { violationCount: 0, warningCount: 0, successCount: 0 },
  );
}

function statusFromCounts(
  violationCount: number,
  warningCount: number,
  successCount: number,
  hasData: boolean,
): ComponentConformaStatus['status'] {
  if (!hasData) return 'unknown';
  if (violationCount > 0) return 'fail';
  if (warningCount > 0) return 'warning';
  if (successCount > 0) return 'pass';
  return 'unknown';
}

export const useApplicationConformaResults = (
  applicationName: string,
): ApplicationConformaResults => {
  const namespace = useNamespace();
  const isKubearchiveLogsEnabled = useIsOnFeatureFlag('kubearchive-logs');

  const [appComponents, componentsLoaded, componentsError] = useComponents(
    namespace,
    applicationName,
  );

  // Shared watch options — used by both useTaskRunsV2 (selector) and the
  // direct useK8sWatchResource below so both operations share the same cache.
  const watchOptions = React.useMemo(
    () =>
      namespace?.length
        ? buildConformaSecurityTaskRunWatchOptions(namespace, applicationName)
        : null,
    [namespace, applicationName],
  );

  const taskRunQueryKey = React.useMemo(
    () =>
      namespace?.length
        ? buildConformaSecurityTaskRunQueryKey(namespace, applicationName)
        : [],
    [namespace, applicationName],
  );

  const taskRunClusterQuery = useK8sWatchResource<TaskRunKind[]>(
    watchOptions,
    TaskRunModel,
    { retry: false },
  );

  const securityTaskRuns = taskRunClusterQuery.data;
  const taskRunsLoaded = !taskRunClusterQuery.isLoading;
  const taskRunsError = taskRunClusterQuery.error;

  const queryClient = useQueryClient();

  const onRefresh = React.useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: taskRunQueryKey });
  }, [queryClient, taskRunQueryKey]);

  const refresh = React.useMemo(
    (): ConformaRefreshState => ({
      lastFetchedAt: taskRunClusterQuery.dataUpdatedAt,
      isRefreshing: taskRunClusterQuery.isFetching,
      hasLiveUpdatesPaused: taskRunClusterQuery.isWatchDegraded,
      onRefresh,
    }),
    [
      taskRunClusterQuery.dataUpdatedAt,
      taskRunClusterQuery.isFetching,
      taskRunClusterQuery.isWatchDegraded,
      onRefresh,
    ],
  );

  const latestPerComponent = React.useMemo((): Map<string, TaskRunKind> => {
    const newestByComp = new Map<string, TaskRunKind>();

    for (const tr of securityTaskRuns ?? []) {
      const comp = tr.metadata?.labels?.[PipelineRunLabel.COMPONENT];
      const trName = tr.metadata?.name;
      if (!comp || !trName) continue;

      const candidateTs = tr.metadata?.creationTimestamp ?? '';
      const existing = newestByComp.get(comp);
      const existingTs = existing?.metadata?.creationTimestamp ?? '';

      if (
        !existing ||
        candidateTs.localeCompare(existingTs) > 0 ||
        (candidateTs === existingTs && trName.localeCompare(existing.metadata?.name ?? '') > 0)
      ) {
        newestByComp.set(comp, tr);
      }
    }

    return newestByComp;
  }, [securityTaskRuns]);

  const latestTaskRuns = React.useMemo(
    () => Array.from(latestPerComponent.values()),
    [latestPerComponent],
  );

  const { logData, allSettled, aggregatedLogError } = useQueries({
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

  const loaded = Boolean(
    namespace?.length && componentsLoaded && taskRunsLoaded,
  );
  const settling = !allSettled;

  const aggregateError = componentsError ?? taskRunsError ?? aggregatedLogError;

  return React.useMemo((): ApplicationConformaResults => {
    if (!namespace?.length) {
      return EMPTY_RESULTS;
    }

    const conformaByComponent = new Map<string, ComponentConformaResult[]>();
    latestTaskRuns.forEach((tr, idx) => {
      const comp = tr.metadata?.labels?.[PipelineRunLabel.COMPONENT];
      if (!comp) return;

      const data = logData[idx];
      if (data) {
        conformaByComponent.set(
          comp,
          filterInvalidImageConformaRows(data.components ?? []),
        );
      }
    });

    const componentStatuses: ComponentConformaStatus[] = appComponents.map((c) => {
      const name = c.metadata?.name;
      if (!name) {
        return {
          componentName: '',
          status: 'unknown' as const,
          violationCount: 0,
          warningCount: 0,
          successCount: 0,
        };
      }

      const components = conformaByComponent.get(name);
      const taskRun = latestPerComponent.get(name);
      const pipelineRunName =
        taskRun?.metadata?.labels?.[TektonResourceLabel.pipelinerun];

      if (!components) {
        return {
          componentName: name,
          status: 'unknown' as const,
          violationCount: 0,
          warningCount: 0,
          successCount: 0,
          pipelineRunName,
        };
      }

      const { violationCount, warningCount, successCount } = aggregateCounts(components);
      const hasData = components.length > 0;

      return {
        componentName: name,
        status: statusFromCounts(violationCount, warningCount, successCount, hasData),
        violationCount,
        warningCount,
        successCount,
        pipelineRunName,
      };
    });

    const mergedConformaRows: ComponentConformaResult[] = [];
    for (const components of conformaByComponent.values()) {
      mergedConformaRows.push(...components);
    }

    const allResults: ConformaResultRow[] = mapConformaResultData(mergedConformaRows);

    const { totalViolations, totalWarnings, totalSuccesses } = allResults.reduce(
      (acc, r) => {
        if (r.status === CONFORMA_RESULT_STATUS.violations) acc.totalViolations++;
        else if (r.status === CONFORMA_RESULT_STATUS.warnings) acc.totalWarnings++;
        else if (r.status === CONFORMA_RESULT_STATUS.successes) acc.totalSuccesses++;
        return acc;
      },
      { totalViolations: 0, totalWarnings: 0, totalSuccesses: 0 },
    );

    const totalComponents = componentStatuses.length;
    const totalFailed = componentStatuses.filter((c) => c.status === 'fail').length;

    return {
      componentStatuses,
      allResults,
      totalComponents,
      totalFailed,
      totalViolations,
      totalWarnings,
      totalSuccesses,
      loaded,
      settling,
      error: aggregateError,
      refresh,
    };
  }, [
    aggregateError,
    appComponents,
    latestPerComponent,
    latestTaskRuns,
    loaded,
    settling,
    logData,
    namespace?.length,
    refresh,
  ]);
};
