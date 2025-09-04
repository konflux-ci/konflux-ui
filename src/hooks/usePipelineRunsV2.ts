import * as React from 'react';
import { useIsOnFeatureFlag } from '~/feature-flags/hooks';
import { useK8sWatchResource } from '~/k8s';
import { useKubearchiveGetResourceQuery } from '~/kubearchive/hooks';
import { PipelineRunModel, PipelineRunGroupVersionKind } from '~/models';
import { PipelineRunKind } from '~/types';
import { EQ } from '~/utils/tekton-results';
import { useTRPipelineRuns } from './useTektonResults';

export const usePipelineRunV2 = (
  namespace: string,
  pipelineRunName: string,
): [PipelineRunKind, boolean, unknown] => {
  const kubearchiveEnabled = useIsOnFeatureFlag('kubearchive-pipeline-runs');
  const enabled = !!namespace && !!pipelineRunName;

  const resourceInit = React.useMemo(
    () =>
      enabled
        ? {
            groupVersionKind: PipelineRunGroupVersionKind,
            namespace,
            watch: true,
            isList: false,
            name: pipelineRunName,
            limit: 1,
          }
        : null,
    [namespace, pipelineRunName, enabled],
  );

  const clusterResult = useK8sWatchResource<PipelineRunKind>(resourceInit, PipelineRunModel, {
    retry: false,
  });

  const tektonResult = useTRPipelineRuns(
    enabled && !kubearchiveEnabled ? namespace : undefined,
    React.useMemo(
      () => ({
        filter: EQ('data.metadata.name', pipelineRunName),
        limit: 1,
      }),
      [pipelineRunName],
    ),
  );

  const kubearchiveResult = useKubearchiveGetResourceQuery(resourceInit, PipelineRunModel, {
    enabled: enabled && kubearchiveEnabled,
  });

  return React.useMemo(() => {
    if (!enabled) {
      return [undefined, false, undefined];
    }

    if (clusterResult.data) {
      return [clusterResult.data, !clusterResult.isLoading, clusterResult.error];
    }

    if (kubearchiveEnabled) {
      return [
        kubearchiveResult.data as PipelineRunKind,
        !kubearchiveResult.isLoading,
        kubearchiveResult.error,
      ];
    }

    return [tektonResult[0]?.[0], tektonResult[1], tektonResult[2]];
  }, [
    enabled,
    clusterResult.data,
    clusterResult.isLoading,
    clusterResult.error,
    kubearchiveEnabled,
    kubearchiveResult.data,
    kubearchiveResult.isLoading,
    kubearchiveResult.error,
    tektonResult,
  ]);
};
