import { useK8sWatchResource } from '../k8s';
import { ReleasePlanGroupVersionKind, ReleasePlanModel } from '../models';
import { ReleasePlanKind } from '../types/coreBuildService';

export const useReleasePlans = (namespace: string): [ReleasePlanKind[], boolean, unknown] => {
  const { data, isLoading, error } = useK8sWatchResource<ReleasePlanKind[]>(
    {
      groupVersionKind: ReleasePlanGroupVersionKind,
      namespace,
      isList: true,
    },
    ReleasePlanModel,
  );

  return [data, !isLoading, error];
};

export const useReleasePlan = (
  namespace: string,
  name: string,
): [ReleasePlanKind, boolean, unknown] => {
  const { data, isLoading, error } = useK8sWatchResource<ReleasePlanKind>(
    {
      groupVersionKind: ReleasePlanGroupVersionKind,
      namespace,
      name,
    },
    ReleasePlanModel,
  );

  return [data, !isLoading, error];
};
