import { useK8sWatchResource } from '../k8s';
import {
  ReleasePlanAdmissionGroupVersionKind,
  ReleasePlanAdmissionModel,
} from '../models/release-plan-admission';
import { ReleasePlanAdmissionKind } from '../types/release-plan-admission';

export const useReleasePlanAdmissions = (
  namespace: string,
): [ReleasePlanAdmissionKind[], boolean, unknown] => {
  const { data, isLoading, error } = useK8sWatchResource<ReleasePlanAdmissionKind[]>(
    {
      groupVersionKind: ReleasePlanAdmissionGroupVersionKind,
      namespace,
      isList: true,
    },
    ReleasePlanAdmissionModel,
  );

  return [data, !isLoading, error];
};
