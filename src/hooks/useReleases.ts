import { useK8sWatchResource } from '../k8s';
import { ReleaseGroupVersionKind, ReleaseModel } from '../models';
import { ReleaseKind } from '../types';

export const useReleases = (namespace: string): [ReleaseKind[], boolean, unknown] => {
  const { data, isLoading, error } = useK8sWatchResource<ReleaseKind[]>(
    {
      groupVersionKind: ReleaseGroupVersionKind,
      namespace,
      isList: true,
      watch: true,
    },
    ReleaseModel,
  );
  return [data, !isLoading, error];
};

export const useRelease = (namespace: string, name: string): [ReleaseKind, boolean, unknown] => {
  const { data, isLoading, error } = useK8sWatchResource<ReleaseKind>(
    {
      groupVersionKind: ReleaseGroupVersionKind,
      namespace,
      name,
      watch: true,
    },
    ReleaseModel,
  );
  return [data, !isLoading, error];
};
