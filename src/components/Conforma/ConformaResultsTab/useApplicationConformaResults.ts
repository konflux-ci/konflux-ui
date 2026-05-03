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
  ql: QualifyingPipeline,
  isKubearchiveLogsEnabled: boolean,
): Promise<ComponentConformaResult[]> {
  const pipelineRunName = ql.pipelineRun.metadata?.name;
  if (!pipelineRunName) return [];

  const listed = sortTaskRunsByTime(
    await listSecurityTaskRuns(namespace, pipelineRunName, ql.securityTaskName),
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

// ── Dev-only mock data (activated via ?mock=conforma) ──────────────────────
function generateMockResults(): ApplicationConformaResults {
  const V = CONFORMA_RESULT_STATUS.violations;
  const W = CONFORMA_RESULT_STATUS.warnings;
  const S = CONFORMA_RESULT_STATUS.successes;

  const components = [
    'api-gateway',
    'auth-service',
    'user-service',
    'payment-processor',
    'notification-engine',
    'search-indexer',
    'analytics-collector',
    'cache-manager',
    'event-bus',
    'rate-limiter',
    'session-store',
    'sms-gateway',
    'queue-consumer',
    'audit-logger',
    'config-service',
    'file-uploader',
    'email-sender',
    'report-generator',
    'identity-provider',
    'metrics-exporter',
    'job-scheduler',
    'webhook-relay',
    'data-pipeline',
    'feature-flags',
    'cdn-proxy',
  ];

  const img = (name: string) =>
    `quay.io/myorg/${name}@sha256:${Array.from(name).reduce((h, c) => ((h << 5) - h + c.charCodeAt(0)) | 0, 0).toString(16).replace('-', '')}00112233445566778899aabb`;

  const rows: ConformaResultRow[] = [];

  const violationRules: {
    title: string;
    description: string;
    solution: string;
    targets: string[];
  }[] = [
    {
      title: 'Missing CVE scan results',
      description:
        'The clair-scan task results have not been found in the SLSA Provenance attestation of the build pipeline.',
      solution: 'Ensure the clair-scan task is included in your build pipeline.',
      targets: [
        'api-gateway',
        'search-indexer',
        'notification-engine',
        'event-bus',
        'data-pipeline',
      ],
    },
    {
      title: 'Missing SLSA provenance',
      description:
        'No SLSA provenance attestation was found for the image. Provenance is required for supply chain security.',
      solution: 'Enable Tekton Chains provenance generation in your pipeline.',
      targets: [
        'api-gateway',
        'search-indexer',
        'notification-engine',
        'event-bus',
        'data-pipeline',
      ],
    },
    {
      title: 'Image signature verification failed',
      description:
        'The container image signature could not be verified against the configured public key.',
      solution: 'Re-sign the image with the correct signing key, or update the policy public key.',
      targets: [
        'api-gateway',
        'search-indexer',
        'notification-engine',
        'event-bus',
        'data-pipeline',
      ],
    },
  ];

  for (const rule of violationRules) {
    for (const comp of rule.targets) {
      rows.push({
        title: rule.title,
        description: rule.description,
        status: V,
        component: comp,
        msg: `${rule.title.replace('Missing ', '').replace(' failed', ' failure')} not found`,
        solution: rule.solution,
        collection: ['minimal'],
        image: img(comp),
      });
    }
  }

  const warningTargets = [
    'api-gateway',
    'analytics-collector',
    'cache-manager',
    'rate-limiter',
    'session-store',
    'sms-gateway',
    'queue-consumer',
    'audit-logger',
  ];
  for (const comp of warningTargets) {
    rows.push({
      title: 'Deprecated API usage detected',
      description:
        'The image was built using a deprecated Tekton API version that will be removed in a future release.',
      status: W,
      component: comp,
      msg: 'Image uses tekton.dev/v1beta1 which is deprecated',
      collection: ['recommended'],
      image: img(comp),
    });
  }

  for (const comp of components) {
    const successes = [
      { title: 'No tasks missing', description: 'At least one Task is present in the PipelineRun attestation.' },
      { title: 'Base image is allowed', description: 'The base image used in the build is from an approved registry.' },
    ];

    const isFailedComp = violationRules.some((r) => r.targets.includes(comp));
    const isWarningComp = warningTargets.includes(comp);

    if (!isFailedComp) {
      successes.push({
        title: 'CVE scan passed',
        description: 'No critical or high CVEs were found in the image.',
      });
    }

    if (!isWarningComp) {
      successes.push({
        title: 'API version current',
        description: 'The image uses the current Tekton API version.',
      });
    }

    for (const s of successes) {
      rows.push({
        title: s.title,
        description: s.description,
        status: S,
        component: comp,
        collection: ['minimal'],
        image: img(comp),
      });
    }
  }

  const totalViolations = rows.filter((r) => r.status === V).length;
  const totalWarnings = rows.filter((r) => r.status === W).length;
  const totalSuccesses = rows.filter((r) => r.status === S).length;

  const failedNames = new Set(violationRules.flatMap((r) => r.targets));

  return {
    componentStatuses: components.map((name) => {
      const compRows = rows.filter((r) => r.component === name);
      const vc = compRows.filter((r) => r.status === V).length;
      const wc = compRows.filter((r) => r.status === W).length;
      const sc = compRows.filter((r) => r.status === S).length;
      return {
        componentName: name,
        status: vc > 0 ? ('fail' as const) : wc > 0 ? ('warning' as const) : ('pass' as const),
        violationCount: vc,
        warningCount: wc,
        successCount: sc,
      };
    }),
    allResults: rows,
    totalComponents: components.length,
    totalFailed: failedNames.size,
    totalViolations,
    totalWarnings,
    totalSuccesses,
    loaded: true,
    error: undefined,
  };
}

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

    if (latestQualifyingPerComponent.length === 0) {
      setConformaByComponent({});
      setConformaBatchFinished(true);
      return;
    }

    let aborted = false;
    setConformaBatchFinished(false);

    const runFetch = async () => {
      const next: Record<string, ConformaByComponentEntry | undefined> = {};

      await Promise.all(
        latestQualifyingPerComponent.map(async (ql) => {
          const prName = ql.pipelineRun.metadata?.name;
          try {
            const components = await fetchConformaForPipeline(
              namespace,
              ql,
              isKubearchiveLogsEnabled,
            );
            if (!aborted) {
              next[ql.componentName] = {
                state: 'ok',
                components,
                pipelineRunName: prName ?? '',
              };
            }
          } catch (e) {
            if (!aborted) {
              next[ql.componentName] = { state: 'error', err: e, pipelineRunName: prName };
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
    // Use stableQualifiers (deep-compared) to prevent re-fetching when the
    // watch hook emits a new array reference with the same pipeline run names.
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
