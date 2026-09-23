import { useMemo } from 'react';
import { useK8sWatchResource } from '~/k8s';
import { ComponentGroupGVK, ComponentGroupModel } from '~/models';
import { ComponentGroupKind } from '~/types';
import { filterDeletedResources } from '~/utils/resource-utils';

export const useComponentGroup = (
  namespace: string,
  componentGroupName: string,
  watch?: boolean,
): [ComponentGroupKind | null, boolean, unknown] => {
  const { data, isLoading, error } = useK8sWatchResource<ComponentGroupKind>(
    componentGroupName
      ? {
          groupVersionKind: ComponentGroupGVK,
          namespace,
          name: componentGroupName,
          watch,
        }
      : undefined,
    ComponentGroupModel,
  );

  return useMemo(() => {
    if (!isLoading && !error && data?.metadata?.deletionTimestamp) {
      return [null, !isLoading, { code: 404 }];
    }

    return [data ?? null, !isLoading, error];
  }, [data, isLoading, error]);
};

export const useComponentGroups = (
  namespace: string,
  watch?: boolean,
): [ComponentGroupKind[], boolean, unknown] => {
  const { data, isLoading, error } = useK8sWatchResource<ComponentGroupKind[]>(
    {
      groupVersionKind: ComponentGroupGVK,
      namespace,
      isList: true,
      watch,
    },
    ComponentGroupModel,
    {
      filterData: filterDeletedResources as (
        resource: ComponentGroupKind[],
      ) => ComponentGroupKind[],
    },
  );

  return useMemo(
    () => [!isLoading && !error ? (data ?? []) : [], !isLoading, error],
    [data, isLoading, error],
  );
};
