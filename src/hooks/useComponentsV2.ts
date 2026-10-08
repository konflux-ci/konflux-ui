import { useMemo } from 'react';
import { useK8sWatchResource } from '~/k8s';
import { ComponentGroupVersionKindV2, ComponentModelV2 } from '~/models';
import { ComponentKind } from '~/types';
import { filterDeletedResources } from '~/utils/resource-utils';

export const useComponentV2 = (
  namespace: string,
  componentName: string,
  watch?: boolean,
): [ComponentKind | null, boolean, unknown] => {
  const { data, isLoading, error } = useK8sWatchResource<ComponentKind>(
    namespace && componentName
      ? {
          groupVersionKind: ComponentGroupVersionKindV2,
          namespace,
          name: componentName,
          watch,
        }
      : undefined,
    ComponentModelV2,
  );

  return useMemo(() => {
    if (!isLoading && !error && data?.metadata?.deletionTimestamp) {
      return [null, true, { code: 404 }];
    }
    return [data ?? null, !isLoading, error];
  }, [data, isLoading, error]);
};

export const useAllComponentsV2 = (
  namespace: string,
  watch?: boolean,
): [ComponentKind[], boolean, unknown] => {
  const { data, isLoading, error } = useK8sWatchResource<ComponentKind[]>(
    namespace
      ? { groupVersionKind: ComponentGroupVersionKindV2, namespace, isList: true, watch }
      : undefined,
    ComponentModelV2,

    { select: filterDeletedResources },
  );

  return useMemo(() => [data, !isLoading, error], [data, isLoading, error]);
};

export const useComponentsByNameV2 = (
  namespace: string,
  componentNames: string[],
  watch?: boolean,
): [ComponentKind[], boolean, unknown] => {
  const [components, loaded, error] = useAllComponentsV2(
    componentNames.length > 0 ? namespace : undefined,
    watch,
  );
  return useMemo(() => {
    const names = new Set(componentNames);
    return [components.filter((component) => names.has(component.metadata?.name)), loaded, error];
  }, [components, componentNames, loaded, error]);
};
