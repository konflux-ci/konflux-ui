import { useMemo } from 'react';
import { useK8sWatchResource } from '~/k8s';
import { ComponentGroupGroupVersionKind, ComponentGroupModel } from '~/models';
import { ComponentGroupKind } from '~/types';

export const useComponentGroup = (
  namespace: string,
  componentGroupName: string,
  watch?: boolean,
): [ComponentGroupKind | null, boolean, unknown] => {
  const { data, isLoading, error } = useK8sWatchResource<ComponentGroupKind>(
    componentGroupName
      ? {
          groupVersionKind: ComponentGroupGroupVersionKind,
          namespace,
          name: componentGroupName,
          watch,
        }
      : undefined,
    ComponentGroupModel,
  );

  return useMemo(() => {
    if (!isLoading && !error && data?.metadata.deletionTimestamp) {
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
      groupVersionKind: ComponentGroupGroupVersionKind,
      namespace,
      isList: true,
      watch,
    },
    ComponentGroupModel,
  );

  return useMemo(
    () => [
      !isLoading && !error ? data?.filter((group) => !group.metadata?.deletionTimestamp) ?? [] : [],
      !isLoading,
      error,
    ],
    [data, isLoading, error],
  );
};
