import React from 'react';
import { MatchLabels } from '~/types/k8s';
import { ReleaseGroupVersionKind, ReleaseModel } from '../models';
import { ReleaseKind } from '../types';
import {
  K8sAndKarchResourcesResult,
  useK8sAndKarchResource,
  useK8sAndKarchResources,
} from './useK8sAndKarchResources';

export const useReleases = (
  namespace: string,
  labels?: MatchLabels,
): K8sAndKarchResourcesResult<ReleaseKind> => {
  const res = useK8sAndKarchResources<ReleaseKind>(
    {
      groupVersionKind: ReleaseGroupVersionKind,
      namespace,
      isList: true,
      selector: labels
        ? {
            matchLabels: labels,
          }
        : undefined,
    },
    ReleaseModel,
  );

  return res;
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
