import * as React from 'react';
import { PipelineRunLabel } from '../consts/pipelinerun';
import { SnapshotGroupVersionKind, SnapshotModel } from '../models';
import { Snapshot } from '../types/coreBuildService';
import { useK8sAndKarchResource, useK8sAndKarchResources } from './useK8sAndKarchResources';

export const useSnapshot = (namespace: string, name: string): [Snapshot, boolean, unknown] => {
  const resourceInit = React.useMemo(
    () =>
      namespace
        ? {
            model: SnapshotModel,
            queryOptions: {
              ns: namespace,
              name,
            },
          }
        : null,
    [namespace, name],
  );

  const { data: snapshot, isLoading, fetchError } = useK8sAndKarchResource<Snapshot>(resourceInit);

  return [snapshot, !isLoading, fetchError];
};

export const useSnapshotsForApplication = (namespace, applicationName) => {
  return useK8sAndKarchResources<Snapshot>(
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
