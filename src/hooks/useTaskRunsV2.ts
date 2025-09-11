import * as React from 'react';
import { useIsOnFeatureFlag } from '../feature-flags/hooks';
import { useK8sWatchResource } from '../k8s';
import { useKubearchiveGetResourceQuery } from '../kubearchive/hooks';
import { TaskRunGroupVersionKind, TaskRunModel } from '../models';
import { TaskRunKind } from '../types';
import { EQ } from '../utils/tekton-results';
import { useTRTaskRuns } from './useTektonResults';

export const useTaskRunV2 = (
  namespace: string,
  taskRunName: string,
): [TaskRunKind | null | undefined, boolean, unknown] => {
  const isKubeArchiveOn = useIsOnFeatureFlag('taskruns-kubearchive');
  const enabled = !!namespace && !!taskRunName;

  // k8s query
  const k8sQuery = useK8sWatchResource<TaskRunKind>(
    enabled
      ? {
          groupVersionKind: TaskRunGroupVersionKind,
          namespace,
          name: taskRunName,
          watch: true,
        }
      : null,
    TaskRunModel,
    { retry: false },
  );

  // kubearachive query
  const kubearchiveQuery = useKubearchiveGetResourceQuery(
    {
      groupVersionKind: TaskRunGroupVersionKind,
      namespace,
      name: taskRunName,
    },
    TaskRunModel,
    {
      enabled: isKubeArchiveOn && enabled,
    },
  );

  // tekton-results query
  const tektonResultsQuery = useTRTaskRuns(
    !isKubeArchiveOn && enabled ? namespace : null,
    React.useMemo(
      () => ({
        name: taskRunName,
        limit: 1,
        filter: EQ('data.metadata.name', taskRunName),
      }),
      [taskRunName],
    ),
  ) as unknown as [TaskRunKind[], boolean, unknown];

  return React.useMemo(() => {
    if (k8sQuery.data) {
      return [k8sQuery.data, !k8sQuery.isLoading, k8sQuery.error];
    }

    if (isKubeArchiveOn) {
      if (kubearchiveQuery.data) {
        return [
          kubearchiveQuery.data as TaskRunKind,
          !kubearchiveQuery.isLoading,
          kubearchiveQuery.error,
        ];
      }

      const isLoading = k8sQuery.isLoading || kubearchiveQuery.isLoading;
      return [kubearchiveQuery.data as TaskRunKind, !isLoading, kubearchiveQuery.error];
    }

    const [trData, trLoaded, trError] = tektonResultsQuery;
    if (trData?.[0]) {
      return [trData[0], trLoaded, trError];
    }

    const isLoading = k8sQuery.isLoading || !trLoaded;
    const error = trError || k8sQuery.error;
    return [undefined, !isLoading, error];
  }, [
    k8sQuery.data,
    k8sQuery.isLoading,
    k8sQuery.error,
    isKubeArchiveOn,
    tektonResultsQuery,
    kubearchiveQuery.data,
    kubearchiveQuery.isLoading,
    kubearchiveQuery.error,
  ]);
};
