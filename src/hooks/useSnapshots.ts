import * as React from 'react';
import { PipelineRunLabel } from '../consts/pipelinerun';
import { useK8sWatchResource } from '../k8s';
import { SnapshotGroupVersionKind, SnapshotModel } from '../models';
import { Snapshot } from '../types/coreBuildService';

export const useSnapshots = (
  namespace: string,
  workspace: string,
  commit?: string,
): [Snapshot[], boolean, unknown] => {
  const {
    data: snapshots,
    isLoading,
    error,
  } = useK8sWatchResource<Snapshot[]>(
    {
      groupVersionKind: SnapshotGroupVersionKind,
      namespace,
      workspace,
      isList: true,
    },
    SnapshotModel,
  );
  return React.useMemo(
    () => [
      !isLoading && !error && commit
        ? snapshots.filter(
            (snapshot) =>
              snapshot.metadata.labels?.[PipelineRunLabel.TEST_SERVICE_COMMIT] === commit ||
              snapshot.metadata.annotations?.[PipelineRunLabel.COMMIT_ANNOTATION] === commit,
          )
        : snapshots,
      !isLoading,
      error,
    ],
    [commit, error, isLoading, snapshots],
  );
};