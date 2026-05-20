import * as React from 'react';
import { useLocation } from 'react-router-dom';
import { extractConformaResultsFromTaskRunLogs } from '~/components/Conforma/utils';
import { PipelineRunLabel, PipelineRunType } from '~/consts/pipelinerun';
import { CONFORMA_TASK, EC_TASK } from '~/consts/security';
import { useIsOnFeatureFlag } from '~/feature-flags/hooks';
import { useComponents } from '~/hooks/useComponents';
import { usePipelineRunsV2 } from '~/hooks/usePipelineRunsV2';
import { sortTaskRunsByTime } from '~/hooks/useTaskRuns';
import { commonFetchJSON, getK8sResourceURL, K8sListResourceItems } from '~/k8s';
import { KUBEARCHIVE_PATH_PREFIX } from '~/kubearchive/const';
import { PodModel } from '~/models/pod';
import { TaskRunModel } from '~/models/taskruns';
import { logger } from '~/monitoring/logger';
import { useDeepCompareMemoize } from '~/shared/hooks/useDeepCompareMemoize';
import { useNamespace } from '~/shared/providers/Namespace';
import type { PipelineRunKind, TaskRunKind } from '~/types';
import {
  ComponentConformaResult,
  CONFORMA_RESULT_STATUS,
  ConformaResult,
  UIConformaData,
} from '~/types/conforma';
import { TektonResourceLabel } from '~/types/coreTekton';
import { getPipelineRunFromTaskRunOwnerRef } from '~/utils/common-utils';
import { isResourceEnterpriseContract } from '~/utils/conforma-utils';
import { isTaskRunInPipelineRun } from '~/utils/pipeline-utils';
import { getTaskRunLog } from '~/utils/tekton-results';
import { generateMockResults } from './__data__/mockConformaResults';

export type ConformaResultRow = UIConformaData & {
  image?: string;
};

export type ComponentConformaStatus = {
  componentName: string;
  status: 'pass' | 'warning' | 'fail' | 'unknown';
  violationCount: number;
  warningCount: number;
  successCount: number;
  pipelineRunName?: string;
};

export type ApplicationConformaResults = {
  componentStatuses: ComponentConformaStatus[];
  allResults: ConformaResultRow[];
  totalComponents: number;
  totalFailed: number;
  totalViolations: number;
  totalWarnings: number;
  totalSuccesses: number;
  loaded: boolean;
  error: unknown;
};

type QualifyingPipeline = {
  componentName: string;
  pipelineRun: PipelineRunKind;
  securityTaskName: typeof EC_TASK | typeof CONFORMA_TASK;
};

type ConformaByComponentEntry =
  | { state: 'ok'; components: ComponentConformaResult[]; pipelineRunName: string }
  | { state: 'error'; err: unknown; pipelineRunName?: string }
  | { state: 'skipped' };

const filterInvalidImageConformaRows = (
  components: ComponentConformaResult[],
): ComponentConformaResult[] =>
  components.filter(
    (comp) =>
      !(
        comp.violations &&
        comp.violations.length === 1 &&
        !comp.violations[0].metadata &&
        comp.violations[0].msg.includes('404 Not Found')
      ),
  );

function securityTaskForPipeline(
  pr: PipelineRunKind,
): QualifyingPipeline['securityTaskName'] | undefined {
  if (isResourceEnterpriseContract(pr)) {
    return EC_TASK;
  }
  if (isTaskRunInPipelineRun(pr, CONFORMA_TASK)) {
    return CONFORMA_TASK;
  }
  return undefined;
}

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

async function listSecurityTaskRuns(
  ns: string,
  pipelineRunName: string,
  pipelineTaskName: string,
): Promise<TaskRunKind[]> {
  return K8sListResourceItems<TaskRunKind>({
    model: TaskRunModel,
    queryOptions: {
      ns,
      queryParams: {
        labelSelector: {
          matchLabels: {
            [TektonResourceLabel.pipelinerun]: pipelineRunName,
            [TektonResourceLabel.pipelineTask]: pipelineTaskName,
          },
        },
      },
    },
  });
}

async function resolveConformaResultFromTaskRun(
  namespace: string,
  taskRun: TaskRunKind,
  isKubearchiveLogsEnabled: boolean,
): Promise<ConformaResult | undefined> {
  const podName = taskRun.status?.podName;
  const taskRunUid = taskRun.metadata?.uid;
  const taskRunNs = taskRun.metadata?.namespace;
  const pipelineRunUid = taskRun.metadata
    ? getPipelineRunFromTaskRunOwnerRef(taskRun)?.uid
    : undefined;

  const podLogOpts = podName
    ? {
        ns: namespace,
        name: podName,
        path: 'log',
        queryParams: { container: 'step-report-json', follow: 'true' },
      }
    : null;

  if (podLogOpts) {
    try {
      return await commonFetchJSON<ConformaResult>(
        getK8sResourceURL(PodModel, undefined, podLogOpts),
      );
    } catch (err) {
      const code =
        typeof err === 'object' && err !== null && 'code' in err && typeof err.code === 'number'
          ? err.code
          : undefined;
      if (code === 404 && isKubearchiveLogsEnabled) {
        try {
          return await commonFetchJSON<ConformaResult>(
            getK8sResourceURL(PodModel, undefined, podLogOpts),
            { pathPrefix: KUBEARCHIVE_PATH_PREFIX },
          );
        } catch (kArchErr) {
          logger.warn('Conforma aggregate: Kubearchive pod log fetch failed', {
            error: kArchErr,
          });
        }
      } else if (code !== 404) {
        logger.warn('Conforma aggregate: pod log fetch failed', { error: err });
      }
    }
  }

  if (taskRunUid && taskRunNs && pipelineRunUid) {
    try {
      const logs = await getTaskRunLog(taskRunNs, taskRunUid, pipelineRunUid);
      return extractConformaResultsFromTaskRunLogs(logs);
    } catch (e) {
      logger.warn('Conforma aggregate: tekton-results log fallback failed', { error: e });
    }
  }

  return undefined;
}

async function fetchConformaForPipeline(
  namespace: string,
  pipelineRunName: string,
  securityTaskName: QualifyingPipeline['securityTaskName'],
  isKubearchiveLogsEnabled: boolean,
): Promise<ComponentConformaResult[]> {
  const listed = sortTaskRunsByTime(
    await listSecurityTaskRuns(namespace, pipelineRunName, securityTaskName),
  );
  const taskRun = listed[0];
  if (!taskRun) return [];

  const conformaRaw = await resolveConformaResultFromTaskRun(
    namespace,
    taskRun,
    isKubearchiveLogsEnabled,
  );
  return filterInvalidImageConformaRows(conformaRaw?.components ?? []);
}

/**
 * Maps ComponentConformaResult[] to ConformaResultRow[], preserving the
 * container image reference that UIConformaData normally drops.
 */
const mapConformaResultDataWithImage = (
  conformaComponents: ComponentConformaResult[],
): ConformaResultRow[] => {
  const rows: ConformaResultRow[] = [];

  for (const comp of conformaComponents) {
    const image = comp.containerImage;

    comp.violations?.forEach((v) => {
      rows.push({
        title: v.metadata?.title,
        description: v.metadata?.description,
        status: CONFORMA_RESULT_STATUS.violations,
        timestamp: v.metadata?.effective_on,
        component: comp.name,
        msg: v.msg,
        collection: v.metadata?.collections,
        solution: v.metadata?.solution,
        image,
      });
    });

    comp.warnings?.forEach((v) => {
      rows.push({
        title: v.metadata?.title,
        description: v.metadata?.description,
        status: CONFORMA_RESULT_STATUS.warnings,
        timestamp: v.metadata?.effective_on,
        component: comp.name,
        msg: v.msg,
        collection: v.metadata?.collections,
        image,
      });
    });

    comp.successes?.forEach((v) => {
      rows.push({
        title: v.metadata?.title,
        description: v.metadata?.description,
        status: CONFORMA_RESULT_STATUS.successes,
        component: comp.name,
        collection: v.metadata?.collections,
        image,
      });
    });
  }

  return rows;
};

export const useApplicationConformaResults = (
  applicationName: string,
): ApplicationConformaResults => {
  const { search } = useLocation();
  const useMock = new URLSearchParams(search).has('mock', 'conforma');

  const namespace = useNamespace();
  const isKubearchiveLogsEnabled = useIsOnFeatureFlag('kubearchive-logs');

  const [appComponents, componentsLoaded, componentsError] = useComponents(
    namespace,
    applicationName,
  );

  const [testRuns, pipelinesLoaded, pipelinesError] = usePipelineRunsV2(
    namespace?.length ? namespace : null,
    {
      selector: {
        matchLabels: {
          [PipelineRunLabel.PIPELINE_TYPE]: PipelineRunType.TEST,
          [PipelineRunLabel.APPLICATION]: applicationName,
        },
      },
    },
  );

  const latestQualifyingPerComponent = React.useMemo((): QualifyingPipeline[] => {
    const newestByComp = new Map<string, PipelineRunKind>();

    for (const pr of testRuns ?? []) {
      const comp = pr.metadata?.labels?.[PipelineRunLabel.COMPONENT];
      const prName = pr.metadata?.name;
      if (!comp || !prName) continue;

      const candidateTs = pr.metadata?.creationTimestamp ?? '';
      const existing = newestByComp.get(comp);
      const existingTs = existing?.metadata?.creationTimestamp ?? '';

      if (
        !existing ||
        candidateTs.localeCompare(existingTs) > 0 ||
        (candidateTs === existingTs && prName.localeCompare(existing.metadata?.name ?? '') > 0)
      ) {
        newestByComp.set(comp, pr);
      }
    }

    const qualifiers: QualifyingPipeline[] = [];
    for (const [componentName, pr] of newestByComp.entries()) {
      const securityTaskName = securityTaskForPipeline(pr);
      if (securityTaskName) {
        qualifiers.push({ componentName, pipelineRun: pr, securityTaskName });
      }
    }
    return qualifiers;
  }, [testRuns]);

  // Stabilize the qualifier list so the fetch effect doesn't re-fire when
  // usePipelineRunsV2 returns a new array reference with identical content.
  const stableQualifiers = useDeepCompareMemoize(
    latestQualifyingPerComponent.map((q) => ({
      componentName: q.componentName,
      pipelineRunName: q.pipelineRun.metadata?.name,
      securityTaskName: q.securityTaskName,
    })),
  );

  const [conformaByComponent, setConformaByComponent] = React.useState<
    Record<string, ConformaByComponentEntry | undefined>
  >({});
  const [conformaBatchFinished, setConformaBatchFinished] = React.useState(false);

  const readyToFetch = Boolean(namespace?.length && pipelinesLoaded && componentsLoaded);

  React.useEffect(() => {
    if (!readyToFetch) return;

    if (!stableQualifiers?.length) {
      setConformaByComponent({});
      setConformaBatchFinished(true);
      return;
    }

    let aborted = false;
    setConformaBatchFinished(false);

    const runFetch = async () => {
      const next: Record<string, ConformaByComponentEntry | undefined> = {};

      await Promise.all(
        stableQualifiers.map(async (sq) => {
          const prName = sq.pipelineRunName;
          if (!prName) return;
          try {
            const components = await fetchConformaForPipeline(
              namespace,
              prName,
              sq.securityTaskName,
              isKubearchiveLogsEnabled,
            );
            if (!aborted) {
              next[sq.componentName] = {
                state: 'ok',
                components,
                pipelineRunName: prName,
              };
            }
          } catch (e) {
            if (!aborted) {
              next[sq.componentName] = { state: 'error', err: e, pipelineRunName: prName };
            }
          }
        }),
      );

      if (aborted) return;
      setConformaByComponent(next);
      setConformaBatchFinished(true);
    };

    void runFetch();
    return () => {
      aborted = true;
    };
  }, [readyToFetch, stableQualifiers, namespace, isKubearchiveLogsEnabled]);

  const loaded = Boolean(
    namespace?.length && componentsLoaded && pipelinesLoaded && conformaBatchFinished,
  );

  const batchError = React.useMemo(() => {
    const entries = Object.values(conformaByComponent);
    const errorEntries = entries.filter((v) => v?.state === 'error');
    if (errorEntries.length > 0) {
      for (const e of errorEntries) {
        if (e?.state === 'error') {
          logger.warn('Conforma aggregate: component-level fetch error', { error: e.err });
        }
      }
    }
    const allFailed = entries.length > 0 && entries.every((v) => v?.state === 'error');
    return allFailed && errorEntries[0]?.state === 'error' ? errorEntries[0].err : undefined;
  }, [conformaByComponent]);

  const aggregateError = componentsError ?? pipelinesError ?? batchError;

  return React.useMemo((): ApplicationConformaResults => {
    if (useMock) {
      return generateMockResults();
    }

    if (!namespace?.length) {
      return {
        componentStatuses: [],
        allResults: [],
        totalComponents: 0,
        totalFailed: 0,
        totalViolations: 0,
        totalWarnings: 0,
        totalSuccesses: 0,
        loaded: false,
        error: undefined,
      };
    }

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

      const entry = conformaByComponent[name];
      if (!entry || entry.state === 'skipped' || entry.state === 'error') {
        return {
          componentName: name,
          status: 'unknown' as const,
          violationCount: 0,
          warningCount: 0,
          successCount: 0,
          pipelineRunName: entry?.state === 'error' ? entry.pipelineRunName : undefined,
        };
      }

      const { violationCount, warningCount, successCount } = aggregateCounts(entry.components);
      const hasData = entry.components.length > 0;

      return {
        componentName: name,
        status: statusFromCounts(violationCount, warningCount, successCount, hasData),
        violationCount,
        warningCount,
        successCount,
        pipelineRunName: entry.pipelineRunName,
      };
    });

    const mergedConformaRows: ComponentConformaResult[] = [];
    for (const v of Object.values(conformaByComponent)) {
      if (v?.state === 'ok') {
        mergedConformaRows.push(...v.components);
      }
    }

    const allResults = mapConformaResultDataWithImage(mergedConformaRows);

    const totalViolations = allResults.filter(
      (r) => r.status === CONFORMA_RESULT_STATUS.violations,
    ).length;
    const totalWarnings = allResults.filter(
      (r) => r.status === CONFORMA_RESULT_STATUS.warnings,
    ).length;
    const totalSuccesses = allResults.filter(
      (r) => r.status === CONFORMA_RESULT_STATUS.successes,
    ).length;

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
      error: aggregateError,
    };
  }, [aggregateError, appComponents, conformaByComponent, loaded, namespace?.length, useMock]);
};
