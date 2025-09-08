import { useMemo } from 'react';
import { useApplicationReleases } from '../../../hooks/useApplicationReleases';
import { ReleaseCondition, ReleaseKind } from '../../../types';

export const useSnapshotLastSuccessfulRelease = (
  applicationName: string,
  snapshotName: string,
): [ReleaseKind | null, boolean, unknown] => {
  const [releases, loaded, error] = useApplicationReleases(applicationName);

  const lastSuccessfulRelease = useMemo(() => {
    if (!loaded || error || !releases) {
      return null;
    }

    // Filter releases for this specific snapshot
    const snapshotReleases = releases.filter((release) => release.spec.snapshot === snapshotName);

    // Filter for successful releases
    const successfulReleases = snapshotReleases.filter((release) => {
      const releasedCondition = release.status?.conditions?.find(
        (c) => c.type === ReleaseCondition.Released,
      );
      return releasedCondition?.status === 'True' && releasedCondition?.reason === 'Succeeded';
    });

    // Sort by creation timestamp since lastTransitionTime might not be available
    if (successfulReleases.length > 0) {
      return successfulReleases.sort((a, b) => {
        const getTimestamp = (release: ReleaseKind) => {
          // Try to get lastTransitionTime from condition if it exists, otherwise use creation timestamp
          const releasedCondition = release.status?.conditions?.find(
            (c) => c.type === ReleaseCondition.Released,
          );
          // Check if the condition has lastTransitionTime property
          const conditionTime =
            releasedCondition && 'lastTransitionTime' in releasedCondition
              ? (releasedCondition as { lastTransitionTime?: string }).lastTransitionTime
              : undefined;
          return conditionTime || release.metadata?.creationTimestamp || '';
        };

        const timestampA = getTimestamp(a);
        const timestampB = getTimestamp(b);
        const dateA = new Date(timestampA);
        const dateB = new Date(timestampB);
        return dateB.getTime() - dateA.getTime();
      })[0];
    }

    return null;
  }, [releases, loaded, error, snapshotName]);

  return [lastSuccessfulRelease, loaded, error];
};
