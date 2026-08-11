import {
  filterInvalidImageConformaRows,
  resolveConformaResultFromTaskRun,
} from '~/components/Conforma/ConformaResultsTab/conforma-fetchers';
import { PipelineRunLabel } from '~/consts/pipelinerun';
import { CONFORMA_TASK, EC_TASK } from '~/consts/security';
import { k8sListResource } from '~/k8s';
import { TaskRunModel } from '~/models/taskruns';
import type { TaskRunKind } from '~/types';
import { ComponentConformaResult } from '~/types/conforma';
import { TektonResourceLabel } from '~/types/coreTekton';
import { sortTaskRunsByTime } from '~/utils/pipeline-utils';

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

export async function fetchConformaForComponent(
  namespace: string,
  componentName: string,
  isKubearchiveLogsEnabled: boolean,
): Promise<ComponentConformaResult[]> {
  for (const taskName of [EC_TASK, CONFORMA_TASK] as const) {
    const res = await k8sListResource<TaskRunKind>({
      model: TaskRunModel,
      queryOptions: {
        ns: namespace,
        queryParams: {
          labelSelector: {
            matchLabels: {
              [PipelineRunLabel.COMPONENT]: componentName,
              [TektonResourceLabel.pipelineTask]: taskName,
            },
          },
        },
      },
    });
    const taskRuns = sortTaskRunsByTime(res.items ?? []);
    if (taskRuns.length === 0) continue;
    const conformaRaw = await resolveConformaResultFromTaskRun(
      namespace,
      taskRuns[0],
      isKubearchiveLogsEnabled,
    );
    return filterInvalidImageConformaRows(conformaRaw?.components ?? []);
  }
  return [];
}
