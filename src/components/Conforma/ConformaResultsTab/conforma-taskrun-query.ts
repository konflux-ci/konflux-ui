import { PipelineRunLabel, PipelineRunType } from '~/consts/pipelinerun';
import { CONFORMA_TASK, EC_TASK } from '~/consts/security';
import { TaskRunGroupVersionKind } from '~/models/taskruns';
import { TektonResourceLabel } from '~/types/coreTekton';
import type { Selector, WatchK8sResource } from '~/types/k8s';

/**
 * Builds the label selector for Conforma/EC security TaskRuns.
 * Shared by both the K8s watch path and the on-demand fetcher path.
 */
export const buildConformaSecurityTaskRunSelector = (
  applicationName: string,
  componentName?: string,
): Selector => ({
  matchLabels: {
    [PipelineRunLabel.APPLICATION]: applicationName,
    ...(componentName ? { [PipelineRunLabel.COMPONENT]: componentName } : {}),
    [PipelineRunLabel.PIPELINE_TYPE]: PipelineRunType.TEST,
  },
  matchExpressions: [
    {
      key: TektonResourceLabel.pipelineTask,
      operator: 'In' as const,
      values: [EC_TASK, CONFORMA_TASK],
    },
  ],
});

/**
 * Returns the WatchK8sResource descriptor for the Conforma security TaskRun
 * list query. The selector is passed to useTaskRunsV2 inside
 * useApplicationConformaResults for integrated TaskRun data fetching.
 */
export const buildConformaSecurityTaskRunWatchOptions = (
  namespace: string,
  applicationName: string,
): WatchK8sResource => ({
  groupVersionKind: TaskRunGroupVersionKind,
  namespace,
  isList: true,
  watch: true,
  selector: buildConformaSecurityTaskRunSelector(applicationName),
});
