import * as React from 'react';
import { ResourceSource } from '~/types/k8s';
import { ReleaseModel } from '../../../models';
import { RELEASEPLAN_TRIGGER_PATH } from '../../../routes/paths';
import { Action } from '../../../shared/components/action-menu/types';
import { useNamespace } from '../../../shared/providers/Namespace';
import { Snapshot } from '../../../types/coreBuildService';
import { useAccessReviewForModel } from '../../../utils/rbac';

export const useSnapshotActions = (snapshot: Snapshot, source?: ResourceSource): Action[] => {
  const namespace = useNamespace();
  const [canCreateRelease] = useAccessReviewForModel(ReleaseModel, 'create');

  const actions: Action[] = React.useMemo(() => {
    if (!snapshot) {
      return [];
    }

    const isArchived = source !== ResourceSource.Cluster;
    const canTriggerRelease = canCreateRelease && !isArchived;

    return [
      {
        cta: canTriggerRelease
          ? {
              href: `${RELEASEPLAN_TRIGGER_PATH.createPath({
                workspaceName: namespace,
              })}?snapshot=${snapshot.metadata.name}`,
            }
          : () => Promise.resolve(),
        id: `trigger-release-${snapshot.metadata.name}`,
        label: 'Trigger release',
        disabled: !canTriggerRelease,
        disabledTooltip: !canCreateRelease
          ? "You don't have access to trigger releases"
          : isArchived
            ? 'Cannot trigger release from archived snapshot'
            : undefined,
        analytics: {
          link_name: 'trigger-release-snapshot',
          link_location: 'snapshot-actions',
          snapshot_name: snapshot.metadata.name,
          namespace,
        },
      },
    ];
  }, [snapshot, canCreateRelease, namespace, source]);

  return actions;
};
