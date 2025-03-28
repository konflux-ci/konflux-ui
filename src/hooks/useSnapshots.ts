import { PipelineRunLabel } from '../consts/pipelinerun';
import { useK8sWatchResource } from '../k8s';
import { SnapshotGroupVersionKind, SnapshotModel } from '../models';
import { Snapshot } from '../types/coreBuildService';

export const useSnapshot = (namespace: string, name: string): [Snapshot, boolean, unknown] => {
  const {
    data: snapshot,
    isLoading,
    error,
  } = useK8sWatchResource<Snapshot>(
    {
      groupVersionKind: SnapshotGroupVersionKind,
      namespace,
      name,
    },
    SnapshotModel,
  );
  return [snapshot, !isLoading, error];
};

export const useSnapshotsForApplication = (namespace, applicationName) => {
  return useK8sWatchResource<Snapshot[]>(
    {
      groupVersionKind: SnapshotGroupVersionKind,
      namespace,
      isList: true,
      selector: {
        matchLabels: {
          [PipelineRunLabel.APPLICATION]: applicationName,
        },
      },
    },
    SnapshotModel,
  );
};
