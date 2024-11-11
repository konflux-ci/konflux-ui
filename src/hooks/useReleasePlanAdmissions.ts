import { useK8sWatchResource } from '../k8s';
import {
  ReleasePlanAdmissionGroupVersionKind,
  ReleasePlanAdmissionModel,
} from '../models/release-plan-admission';
import { ReleasePlanAdmissionKind } from '../types/release-plan-admission';

export const useReleasePlanAdmissions = (
  namespace: string,
  workspace: string,
): [ReleasePlanAdmissionKind[], boolean, unknown] => {
  const { data, isLoading, error } = useK8sWatchResource<ReleasePlanAdmissionKind[]>(
    {
      groupVersionKind: ReleasePlanAdmissionGroupVersionKind,
      namespace,
      workspace,
      isList: true,
    },
    ReleasePlanAdmissionModel,
  );

  return [data, !isLoading, error];
};
