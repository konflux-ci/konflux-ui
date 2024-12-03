import * as React from 'react';
import { useWorkspaceInfo } from '../components/Workspace/useWorkspaceInfo';
import { useK8sWatchResource } from '../k8s';
import { ReleaseGroupVersionKind, ReleaseModel } from '../models';
import { ReleaseKind } from '../types';
import { useApplicationSnapshots } from './useApplicationSnapshots';

export const useApplicationReleases = (
  applicationName: string,
): [ReleaseKind[], boolean, unknown] => {
  const { namespace, workspace } = useWorkspaceInfo();
  const {
    data: releases,
    isLoading: releasesLoaded,
    error: releasesError,
  } = useK8sWatchResource<ReleaseKind[]>(
    {
      groupVersionKind: ReleaseGroupVersionKind,
      namespace,
      workspace,
      isList: true,
      watch: true,
    },
    ReleaseModel,
  );

  const [snapshots, snapshotsLoaded, snapshotsError] = useApplicationSnapshots(applicationName);

  const releasesForApp = React.useMemo(
    () =>
      !releasesLoaded && snapshotsLoaded
        ? releases.filter((r) => snapshots.some((s) => s.metadata.name === r.spec.snapshot))
        : [],
    [releases, releasesLoaded, snapshots, snapshotsLoaded],
  );

  return [releasesForApp, !releasesLoaded && snapshotsLoaded, releasesError || snapshotsError];
};
