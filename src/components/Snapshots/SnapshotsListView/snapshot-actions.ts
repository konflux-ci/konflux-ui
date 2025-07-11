import * as React from 'react';
import { ReleaseModel } from '../../../models';
import { RELEASEPLAN_TRIGGER_PATH } from '../../../routes/paths';
import { Action } from '../../../shared/components/action-menu/types';
import { useNamespace } from '../../../shared/providers/Namespace';
import { Snapshot } from '../../../types/coreBuildService';
import { useAccessReviewForModel } from '../../../utils/rbac';

export const useSnapshotActions = (snapshot: Snapshot): Action[] => {
  const namespace = useNamespace();
  const [canCreateRelease] = useAccessReviewForModel(ReleaseModel, 'create');

  const actions: Action[] = React.useMemo(() => {
    if (!snapshot) {
      return [];
    }
    const canTrigger = canCreateRelease;

    return [
      {
        cta: canTrigger
          ? {
              href: `${RELEASEPLAN_TRIGGER_PATH.createPath({
                workspaceName: namespace,
              })}?snapshot=${snapshot.metadata.name}`,
            }
          : () => Promise.resolve(),
        id: `trigger-release-${snapshot.metadata.name}`,
        label: 'Trigger release',
        disabled: !canCreateRelease,
        disabledTooltip: !canCreateRelease
          ? "You don't have access to trigger releases"
          : undefined,
        analytics: {
          link_name: 'trigger-release-snapshot',
          link_location: 'snapshot-actions',
          snapshot_name: snapshot.metadata.name,
          namespace,
        },
      },
    ];
  }, [snapshot, canCreateRelease, namespace]);

  return actions;
};
