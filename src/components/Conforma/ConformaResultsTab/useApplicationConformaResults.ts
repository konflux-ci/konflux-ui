import * as React from 'react';
import { useQueries, type UseQueryResult } from '@tanstack/react-query';
import { PipelineRunLabel } from '~/consts/pipelinerun';
import { useIsOnFeatureFlag } from '~/feature-flags/hooks';
import { useComponents } from '~/hooks/useComponents';
import { useTaskRunsV2 } from '~/hooks/useTaskRunsV2';
import { logger } from '~/monitoring/logger';
import { useNamespace } from '~/shared/providers/Namespace';
import type { TaskRunKind } from '~/types';
import { ComponentConformaResult } from '~/types/conforma';
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
import { buildConformaSecurityTaskRunWatchOptions } from './conforma-taskrun-query';

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
  loaded: false,
  error: undefined,
  partialLogError: undefined,
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

  // Conforma security TaskRun selector — passed to useTaskRunsV2 so list data
  // comes from the shared TaskRun data source (cluster watch + Tekton Results / KubeArchive).
  const watchOptions = React.useMemo(
    () =>
      namespace?.length
        ? buildConformaSecurityTaskRunWatchOptions(namespace, applicationName)
        : null,
    [namespace, applicationName],
  );

  const [securityTaskRuns, taskRunsLoaded, taskRunsError, , , taskRunWatchMeta] = useTaskRunsV2(
    namespace,
    watchOptions ? { selector: watchOptions.selector } : undefined,
  );

  const { refetch: refetchTaskRuns } = taskRunWatchMeta;
  const onRefresh = React.useCallback(() => {
    void refetchTaskRuns();
  }, [refetchTaskRuns]);

  const refresh = React.useMemo(
    (): ConformaRefreshState => ({
      lastFetchedAt: taskRunWatchMeta.dataUpdatedAt,
      isRefreshing: taskRunWatchMeta.isFetching,
      hasLiveUpdatesPaused: taskRunWatchMeta.isWatchDegraded,
      onRefresh,
    }),
    [
      taskRunWatchMeta.dataUpdatedAt,
      taskRunWatchMeta.isFetching,
      taskRunWatchMeta.isWatchDegraded,
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

  const combineConformaLogResults = React.useCallback(
    (
      results: UseQueryResult<Awaited<ReturnType<typeof resolveConformaResultFromTaskRun>>>[],
    ) => ({
      logData: results.map((q) => q.data),
      aggregatedLogError:
        results.length > 0 && results.some((q) => q.isError)
          ? results.find((q) => q.isError)?.error
          : undefined,
    }),
    [],
  );

  const { logData, aggregatedLogError } = useQueries({
    queries: latestTaskRuns.map((tr) => ({
      queryKey: ['conforma-log', namespace, tr.metadata?.uid, isKubearchiveLogsEnabled] as const,
      queryFn: () => resolveConformaResultFromTaskRun(namespace, tr, isKubearchiveLogsEnabled),
      staleTime: Infinity,
      enabled: !!namespace && !!tr.metadata?.uid,
    })),
    combine: combineConformaLogResults,
  });

  const loaded = Boolean(namespace?.length && componentsLoaded && taskRunsLoaded);

  const fatalError = componentsError ?? taskRunsError;

  React.useEffect(() => {
    if (aggregatedLogError) {
      logger.warn('Partial Conforma log fetch failure', { error: aggregatedLogError });
    }
  }, [aggregatedLogError]);

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
        conformaByComponent.set(comp, filterInvalidImageConformaRows(data.components ?? []));
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
      const pipelineRunName = taskRun?.metadata?.labels?.[TektonResourceLabel.pipelinerun];

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

    const allResults: ConformaResultRow[] = [];
    for (const [realComponentName, components] of conformaByComponent.entries()) {
      const rows = mapConformaResultData(components);
      // The EC/Conforma report assigns its own per-image `name` to each
      // components[] entry (see ComponentConformaResult), which is NOT the
      // real K8s component name and can differ across architecture images
      // of the same logical component. Overwrite it with the authoritative
      // name so rows stay associated with the correct component regardless
      // of how many arch-specific images were evaluated for it.
      rows.forEach((row) => {
        row.component = realComponentName;
      });
      allResults.push(...rows);
    }

    const totalComponents = componentStatuses.length;
    const totalFailed = componentStatuses.filter((c) => c.status === 'fail').length;

    return {
      componentStatuses,
      allResults,
      totalComponents,
      totalFailed,
      loaded,
      error: fatalError,
      partialLogError: aggregatedLogError,
      refresh,
    };
  }, [
    aggregatedLogError,
    appComponents,
    fatalError,
    latestPerComponent,
    latestTaskRuns,
    loaded,
    logData,
    namespace?.length,
    refresh,
  ]);
};
