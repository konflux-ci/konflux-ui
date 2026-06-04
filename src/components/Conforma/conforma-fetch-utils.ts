import { extractConformaResultsFromTaskRunLogs } from '~/components/Conforma/utils';
import { CONFORMA_TASK, EC_TASK } from '~/consts/security';
import { sortTaskRunsByTime } from '~/hooks/useTaskRuns';
import { commonFetchJSON, getK8sResourceURL, K8sListResourceItems } from '~/k8s';
import { KUBEARCHIVE_PATH_PREFIX } from '~/kubearchive/const';
import { PodModel } from '~/models/pod';
import { TaskRunModel } from '~/models/taskruns';
import { logger } from '~/monitoring/logger';
import type { PipelineRunKind, TaskRunKind } from '~/types';
import { ComponentConformaResult, ConformaResult } from '~/types/conforma';
import { TektonResourceLabel } from '~/types/coreTekton';
import { getPipelineRunFromTaskRunOwnerRef } from '~/utils/common-utils';
import { isResourceEnterpriseContract } from '~/utils/conforma-utils';
import { isTaskRunInPipelineRun } from '~/utils/pipeline-utils';
import { getTaskRunLog } from '~/utils/tekton-results';

export type SecurityTaskName = typeof EC_TASK | typeof CONFORMA_TASK;

export function securityTaskForPipeline(pr: PipelineRunKind): SecurityTaskName | undefined {
  if (isResourceEnterpriseContract(pr)) {
    return EC_TASK;
  }
  if (isTaskRunInPipelineRun(pr, CONFORMA_TASK)) {
    return CONFORMA_TASK;
  }
  return undefined;
}

export function aggregateCounts(components: ComponentConformaResult[]) {
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

export const filterInvalidImageConformaRows = (
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

export async function listSecurityTaskRuns(
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

export async function resolveConformaResultFromTaskRun(
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

export async function fetchConformaForPipeline(
  namespace: string,
  pipelineRunName: string,
  securityTaskName: SecurityTaskName,
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
