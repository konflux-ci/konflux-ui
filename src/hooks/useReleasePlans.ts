import { useK8sWatchResource } from '../k8s';
import { ReleasePlanGroupVersionKind, ReleasePlanModel } from '../models';
import { ReleasePlanKind } from '../types/coreBuildService';

export const useReleasePlans = (
  namespace: string,
  workspace: string,
): [ReleasePlanKind[], boolean, unknown] => {
  const { data, isLoading, error } = useK8sWatchResource<ReleasePlanKind[]>(
    {
      groupVersionKind: ReleasePlanGroupVersionKind,
      namespace,
      workspace,
      isList: true,
    },
    ReleasePlanModel,
  );

  return [data, !isLoading, error];
};

export const useReleasePlan = (
  namespace: string,
  workspace: string,
  name: string,
): [ReleasePlanKind, boolean, unknown] => {
  const { data, isLoading, error } = useK8sWatchResource<ReleasePlanKind>(
    {
      groupVersionKind: ReleasePlanGroupVersionKind,
      namespace,
      workspace,
      name,
    },
    ReleasePlanModel,
  );

  return [data, !isLoading, error];
};
