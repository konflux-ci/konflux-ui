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
  fetchLatestSecurityTaskRunForComponent,
  filterInvalidImageConformaRows,
  mapConformaResultData,
  resolveConformaResultFromTaskRun,
} from './conforma-fetchers';
import { buildConformaSecurityTaskRunWatchOptions } from './conforma-taskrun-query';

/** Multiplier for per-component TaskRun headroom in the bounded batch (arch variants, retries). */
const BATCH_LIMIT_PER_COMPONENT = 3;
/** Minimum batch size so the first fetch stays bounded before components finish loading. */
const BATCH_LIMIT_FLOOR = 10;

const NO_OP_REFRESH: ConformaRefreshState = {
  lastFetchedAt: 0,
  isRefreshing: false,
  onRefresh: () => undefined,
};

const EMPTY_RESULTS: ApplicationConformaResults = {
  componentStatuses: [],
  allResults: [],
  totalComponents: 0,
  totalFailed: 0,
  loaded: false,
  settling: false,
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

function pickNewest(existing: TaskRunKind | undefined, candidate: TaskRunKind): TaskRunKind {
  if (!existing) return candidate;
  const candidateTs = candidate.metadata?.creationTimestamp ?? '';
  const existingTs = existing.metadata?.creationTimestamp ?? '';
  if (
    candidateTs.localeCompare(existingTs) > 0 ||
    (candidateTs === existingTs &&
      (candidate.metadata?.name ?? '').localeCompare(existing.metadata?.name ?? '') > 0)
  ) {
    return candidate;
  }
  return existing;
}

export const useApplicationConformaResults = (
  applicationName: string,
): ApplicationConformaResults => {
  const namespace = useNamespace();
  const isKubearchiveLogsEnabled = useIsOnFeatureFlag('kubearchive-logs');
  const isKubearchiveTaskRunsEnabled = useIsOnFeatureFlag('taskruns-kubearchive');

  const [appComponents, componentsLoaded, componentsError] = useComponents(
    namespace,
    applicationName,
  );

  // Always apply a floor so useTaskRunsV2 never fires an unbounded list while components load.
  const batchLimit = React.useMemo(
    () =>
      Math.max(
        (componentsLoaded ? appComponents.length : 0) * BATCH_LIMIT_PER_COMPONENT,
        BATCH_LIMIT_FLOOR,
      ),
    [appComponents.length, componentsLoaded],
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

  // Infinity staleTime: WS keeps data live; refresh button covers explicit refetch (vs global 30s).
  const [securityTaskRuns, taskRunsLoaded, taskRunsError, , , taskRunWatchMeta] = useTaskRunsV2(
    namespace,
    watchOptions ? { selector: watchOptions.selector, limit: batchLimit } : undefined,
    { staleTime: Infinity },
  );

  const { refetch: refetchTaskRuns } = taskRunWatchMeta;
  const onRefresh = React.useCallback(() => {
    void refetchTaskRuns();
  }, [refetchTaskRuns]);

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

  // --- Fill-in: fetch latest TaskRun for components missing from the batch ---
  const missingComponents = React.useMemo(() => {
    if (!taskRunsLoaded || !componentsLoaded) return [];
    return appComponents
      .map((c) => c.metadata?.name)
      .filter((name): name is string => !!name && !latestPerComponent.has(name));
  }, [appComponents, componentsLoaded, taskRunsLoaded, latestPerComponent]);

  const { fillInTaskRuns, fillInSettled, fillInErrors, fillInErrorKey } = useQueries({
    queries: missingComponents.map((componentName) => ({
      queryKey: [
        'conforma-fillin',
        namespace,
        componentName,
        applicationName,
        isKubearchiveTaskRunsEnabled,
      ] as const,
      queryFn: () =>
        fetchLatestSecurityTaskRunForComponent(
          namespace,
          applicationName,
          componentName,
          isKubearchiveTaskRunsEnabled,
        ),
      staleTime: Infinity,
      enabled: !!namespace && missingComponents.length > 0,
    })),
    combine: (results) => {
      const errors = results
        .filter((q) => q.isError)
        .map((q) => q.error)
        .filter((error): error is Error => error != null);
      return {
        fillInTaskRuns: results.map((q) => q.data).filter((tr): tr is TaskRunKind => tr != null),
        fillInSettled: results.every((q) => !q.isLoading),
        fillInErrors: errors,
        // Stable key so the logging effect does not re-fire on every combine recompute.
        fillInErrorKey: errors.map((e) => e.message).join('\0'),
      };
    },
  });

  const fillInErrorsRef = React.useRef(fillInErrors);
  fillInErrorsRef.current = fillInErrors;

  React.useEffect(() => {
    if (!fillInErrorKey) return;
    for (const error of fillInErrorsRef.current) {
      logger.warn('useApplicationConformaResults: fill-in query failed', { error });
    }
  }, [fillInErrorKey]);

  // Merge batch + fill-in into a single latest-per-component map
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

  const combineConformaLogResults = React.useCallback(
    (
      results: UseQueryResult<Awaited<ReturnType<typeof resolveConformaResultFromTaskRun>>>[],
    ) => ({
      logData: results.map((q) => q.data),
      allSettled: results.every((q) => !q.isLoading),
      aggregatedLogError:
        results.length > 0 && results.some((q) => q.isError)
          ? results.find((q) => q.isError)?.error
          : undefined,
    }),
    [],
  );

  const { logData, allSettled: logsSettled, aggregatedLogError } = useQueries({
    queries: latestTaskRuns.map((tr) => ({
      queryKey: ['conforma-log', namespace, tr.metadata?.uid, isKubearchiveLogsEnabled] as const,
      queryFn: () => resolveConformaResultFromTaskRun(namespace, tr, isKubearchiveLogsEnabled),
      staleTime: Infinity,
      enabled: !!namespace && !!tr.metadata?.uid,
    })),
    combine: combineConformaLogResults,
  });

  const loaded = Boolean(namespace?.length && componentsLoaded && taskRunsLoaded);
  const settling = !fillInSettled || !logsSettled;

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
      const taskRun = mergedLatestPerComponent.get(name);
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
      rows.forEach((row) => {
        // The EC/Conforma report assigns its own per-image `name` to each
        // components[] entry, which is NOT the real K8s component name.
        // Overwrite with the authoritative name so rows stay associated correctly.
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
      settling,
      error: fatalError,
      partialLogError: aggregatedLogError,
      refresh,
    };
  }, [
    aggregatedLogError,
    appComponents,
    fatalError,
    mergedLatestPerComponent,
    latestTaskRuns,
    loaded,
    settling,
    logData,
    namespace?.length,
    refresh,
  ]);
};
