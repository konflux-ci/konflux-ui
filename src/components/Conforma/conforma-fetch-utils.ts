import { CONFORMA_TASK, EC_TASK } from '~/consts/security';
import { k8sListResource } from '~/k8s';
import { TaskRunModel } from '~/models/taskruns';
import type { PipelineRunKind, TaskRunKind } from '~/types';
import { ComponentConformaResult } from '~/types/conforma';
import { TektonResourceLabel } from '~/types/coreTekton';
import { isResourceEnterpriseContract } from '~/utils/conforma-utils';
import { isTaskRunInPipelineRun, sortTaskRunsByTime } from '~/utils/pipeline-utils';
import {
  filterInvalidImageConformaRows,
  resolveConformaResultFromTaskRun,
} from './ConformaResultsTab/conforma-fetchers';

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

async function listSecurityTaskRuns(
  ns: string,
  pipelineRunName: string,
  pipelineTaskName: string,
) {
  const res = await k8sListResource<TaskRunKind>({
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
  return res.items ?? [];
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
