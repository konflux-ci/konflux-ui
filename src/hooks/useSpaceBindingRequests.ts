import { useK8sWatchResource } from '../k8s';
import { SpaceBindingRequestGroupVersionKind, SpaceBindingRequestModel } from '../models';
import { SpaceBindingRequest } from '../types';

export const useSpaceBindingRequest = (
  namespace: string,
  workspace: string,
  name: string,
): [SpaceBindingRequest, boolean, unknown] => {
  const {
    data: binding,
    isLoading,
    error,
  } = useK8sWatchResource<SpaceBindingRequest>(
    {
      groupVersionKind: SpaceBindingRequestGroupVersionKind,
      name,
      namespace,
      workspace,
    },
    SpaceBindingRequestModel,
  );
  return [binding, !isLoading, error];
};
