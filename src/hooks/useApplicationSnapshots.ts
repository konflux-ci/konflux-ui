import * as React from 'react';
import { useWorkspaceInfo } from '../components/Workspace/workspace-context';
import { useK8sWatchResource } from '../k8s';
import { SnapshotGroupVersionKind, SnapshotModel } from '../models';
import { Snapshot } from '../types/coreBuildService';

export const useApplicationSnapshots = (
  applicationName: string,
): [Snapshot[], boolean, unknown] => {
  const { namespace, workspace } = useWorkspaceInfo();
  const {
    data: snapshots,
    isLoading,
    error: loadError,
  } = useK8sWatchResource<Snapshot[]>(
    {
      groupVersionKind: SnapshotGroupVersionKind,
      namespace,
      workspace,
      isList: true,
    },
    SnapshotModel,
  );

  const applicationSnapshots = React.useMemo(
    () => snapshots?.filter((s) => s.spec.application === applicationName),
    [applicationName, snapshots],
  );

  return [applicationSnapshots, !isLoading, loadError];
};
