import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { useApplicationReleases } from '../../../hooks/useApplicationReleases';
import { useReleasePlans } from '../../../hooks/useReleasePlans';
import { ReleaseModel } from '../../../models';
import { RELEASEPLAN_TRIGGER_PATH } from '../../../routes/paths';
import { Action } from '../../../shared/components/action-menu/types';
import { useNamespace } from '../../../shared/providers/Namespace';
import { ReleasePlanLabel, Snapshot } from '../../../types/coreBuildService';
import { useAccessReviewForModel } from '../../../utils/rbac';

export const useSnapshotActions = (snapshot: Snapshot): Action[] => {
  const namespace = useNamespace();
  const navigate = useNavigate();
  const [canCreateRelease] = useAccessReviewForModel(ReleaseModel, 'create');
  const [releasePlans, releasePlansLoaded] = useReleasePlans(namespace);
  const [releases, releasesLoaded] = useApplicationReleases(snapshot.spec?.application || '');

  const actions: Action[] = React.useMemo(() => {
    if (!snapshot) {
      return [];
    }

    // Find release plans for this application
    const applicationName = snapshot.spec?.application;

    // If release plans or releases are still loading, show disabled action
    if (!releasePlansLoaded || !releasesLoaded) {
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

    // Check if there are existing releases for this snapshot
    const snapshotReleases = releases.filter(
      (release) => release.spec.snapshot === snapshot.metadata.name,
    );

    // Also check if the snapshot itself indicates it was auto-released
    const autoReleasedCondition = snapshot.status?.conditions?.find(
      (condition) => condition.type === 'AutoReleased' && condition.status === 'True',
    );

    const hasExistingReleases = snapshotReleases.length > 0 || !!autoReleasedCondition;

    // Determine the action label based on whether releases exist for this snapshot
    const actionLabel = hasExistingReleases ? 'Re-trigger release' : 'Trigger release';

    const updatedActions: Action[] = [
      {
        cta: () => {
          const releasePlanName = selectedReleasePlan?.metadata.name;

          const triggerReleasePath = RELEASEPLAN_TRIGGER_PATH.createPath({
            workspaceName: namespace,
            releasePlanName,
          });

          // Add snapshot as a search parameter
          const searchParams = new URLSearchParams({
            snapshot: snapshot.metadata.name,
          });

          navigate(`${triggerReleasePath}?${searchParams.toString()}`);
        },
        id: `trigger-release-${snapshot.metadata.name}`,
        label: actionLabel,
        disabled: !canCreateRelease,
        disabledTooltip: !canCreateRelease
          ? "You don't have access to trigger releases"
          : undefined,
        analytics: {
          link_name: hasExistingReleases
            ? 'retrigger-release-snapshot'
            : 'trigger-release-snapshot',
          link_location: 'snapshot-actions',
          snapshot_name: snapshot.metadata.name,
          release_plan: selectedReleasePlan?.metadata.name || 'none',
          namespace,
          hasExistingReleases,
        },
      },
    ];

    return updatedActions;
  }, [
    snapshot,
    releasePlansLoaded,
    releasePlans,
    canCreateRelease,
    namespace,
    releases,
    releasesLoaded,
    navigate,
  ]);

  return actions;
};
