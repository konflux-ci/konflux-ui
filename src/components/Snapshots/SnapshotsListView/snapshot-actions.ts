import * as React from 'react';
import { ReleaseLabel } from '../../../consts/release';
import { useReleasePlans } from '../../../hooks/useReleasePlans';
import { K8sQueryCreateResource } from '../../../k8s';
import { ReleaseModel } from '../../../models';
import { Action } from '../../../shared/components/action-menu/types';
import { useNamespace } from '../../../shared/providers/Namespace';
import { ReleaseKind, ReleasePlanLabel, Snapshot } from '../../../types/coreBuildService';
import { useAccessReviewForModel } from '../../../utils/rbac';

export const useSnapshotActions = (snapshot: Snapshot): Action[] => {
  const namespace = useNamespace();
  const [canCreateRelease] = useAccessReviewForModel(ReleaseModel, 'create');
  const [releasePlans, releasePlansLoaded] = useReleasePlans(namespace);

  const actions: Action[] = React.useMemo(() => {
    if (!snapshot) {
      return [];
    }

    // Find release plans for this application
    const applicationName = snapshot.spec?.application;

    // If release plans are still loading, show disabled action
    if (!releasePlansLoaded) {
      return [
        {
          cta: () => Promise.resolve(),
          id: `trigger-release-${snapshot.metadata.name}`,
          label: 'Trigger release',
          disabled: true,
          disabledTooltip: 'Loading release plans...',
          analytics: {
            link_name: 'trigger-release-snapshot',
            link_location: 'snapshot-actions',
            // eslint-disable-next-line camelcase
            snapshot_name: snapshot.metadata.name,
            namespace,
          },
        },
      ];
    }

    const availableReleasePlans = releasePlans.filter(
      (plan) => plan.spec?.application === applicationName,
    );

    // Prioritize auto-release enabled plans
    const autoReleasePlans = availableReleasePlans.filter(
      (plan) => plan.metadata?.labels?.[ReleasePlanLabel.AUTO_RELEASE] === 'true',
    );

    const selectedReleasePlan =
      autoReleasePlans.length > 0 ? autoReleasePlans[0] : availableReleasePlans[0];

    const updatedActions: Action[] = [
      {
        cta: async () => {
          if (!selectedReleasePlan) {
            throw new Error('No release plan available');
          }

          const release: ReleaseKind = {
            apiVersion: 'appstudio.redhat.com/v1alpha1',
            kind: 'Release',
            metadata: {
              generateName: `${selectedReleasePlan.metadata.name}-`,
              namespace,
              labels: {
                [ReleaseLabel.AUTOMATED]: 'false',
              },
            },
            spec: {
              releasePlan: selectedReleasePlan.metadata.name,
              snapshot: snapshot.metadata.name,
            },
          };

          return K8sQueryCreateResource({
            model: ReleaseModel,
            queryOptions: {
              ns: namespace,
            },
            resource: release,
          });
        },
        id: `trigger-release-${snapshot.metadata.name}`,
        label: 'Trigger release',
        disabled: !canCreateRelease || !selectedReleasePlan,
        disabledTooltip: !canCreateRelease
          ? "You don't have access to trigger releases"
          : !selectedReleasePlan
            ? 'No release plan found for this application'
            : undefined,
        analytics: {
          link_name: 'trigger-release-snapshot',
          link_location: 'snapshot-actions',
          snapshot_name: snapshot.metadata.name,
          release_plan: selectedReleasePlan?.metadata.name || 'none',
          namespace,
        },
      },
    ];

    return updatedActions;
  }, [snapshot, releasePlansLoaded, releasePlans, canCreateRelease, namespace]);

  return actions;
};
