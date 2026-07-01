import { QueryKey } from '@tanstack/react-query';
import { PipelineRunLabel, PipelineRunType } from '~/consts/pipelinerun';
import { CONFORMA_TASK, EC_TASK } from '~/consts/security';
import { convertToK8sQueryParams } from '~/k8s/k8s-utils';
import { createQueryKeys } from '~/k8s/query/utils';
import { TaskRunModel, TaskRunGroupVersionKind } from '~/models/taskruns';
import { TektonResourceLabel } from '~/types/coreTekton';
import { WatchK8sResource } from '~/types/k8s';

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
  selector: {
    matchLabels: {
      [PipelineRunLabel.APPLICATION]: applicationName,
      [PipelineRunLabel.PIPELINE_TYPE]: PipelineRunType.TEST,
    },
    matchExpressions: [
      {
        key: TektonResourceLabel.pipelineTask,
        operator: 'In' as const,
        values: [EC_TASK, CONFORMA_TASK],
      },
    ],
  },
});

/**
 * Returns the React Query cache key for the Conforma security TaskRun list.
 * Mirrors the key that useK8sWatchResource produces internally so that
 * queryClient.invalidateQueries() targets the correct cache entry.
 */
export const buildConformaSecurityTaskRunQueryKey = (
  namespace: string,
  applicationName: string,
): QueryKey =>
  createQueryKeys({
    model: TaskRunModel,
    queryOptions: convertToK8sQueryParams(
      buildConformaSecurityTaskRunWatchOptions(namespace, applicationName),
    ),
  });
