import React from 'react';
import { PipelineRunLabel } from '~/consts/pipelinerun';
import { useK8sWatchResource } from '../k8s';
import { ReleaseGroupVersionKind, ReleaseModel } from '../models';
import { ReleaseKind } from '../types';
import { useK8sAndKarchResource } from './useK8sAndKarchResources';

export const useReleases = (
  namespace: string,
  applicationName?: string,
): [ReleaseKind[], boolean, unknown] => {
  const { data, isLoading, error } = useK8sWatchResource<ReleaseKind[]>(
    {
      groupVersionKind: ReleaseGroupVersionKind,
      namespace,
      isList: true,
      watch: true,
      ...(applicationName
        ? {
            selector: {
              matchLabels: {
                [PipelineRunLabel.APPLICATION]: applicationName,
              },
            },
          }
        : {}),
    },
    ReleaseModel,
  );
  return [data, !isLoading, error];
};

export const useRelease = (
  namespace: string,
  name: string,
): [ReleaseKind, boolean, unknown, unknown, boolean] => {
  const resourceInit = React.useMemo(
    () => ({
      model: ReleaseModel,
      queryOptions: {
        ns: namespace,
        name,
      },
    }),
    [namespace, name],
  );
  const { data, isLoading, fetchError, wsError, isError } =
    useK8sAndKarchResource<ReleaseKind>(resourceInit);
  return [data, !isLoading, fetchError, wsError, isError];
};
