import React from 'react';
import { ReleaseLabel } from '~/consts/release';
import { ReleaseGroupVersionKind, ReleaseModel } from '~/models';
import { ReleaseKind } from '~/types';
import {
  K8sAndKarchResourcesResult,
  useK8sAndKarchResource,
  useK8sAndKarchResources,
} from './useK8sAndKarchResources';

export const useReleasesV2 = (
  namespace: string,
  groupName: string | undefined,
): K8sAndKarchResourcesResult<ReleaseKind> => {
  const res = useK8sAndKarchResources<ReleaseKind>(
    {
      groupVersionKind: ReleaseGroupVersionKind,
      namespace,
      isList: true,
      selector: groupName
        ? {
            matchLabels: {
              [ReleaseLabel.COMPONENT_GROUP]: groupName,
            },
          }
        : undefined,
    },
    ReleaseModel,
  );

  return res;
};

export const useReleaseV2 = (
  namespace: string,
  name: string,
): [ReleaseKind | undefined, boolean, unknown, unknown, boolean] => {
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
