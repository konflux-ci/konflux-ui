import * as React from 'react';
import { SortByDirection } from '@patternfly/react-table';
import { useSortedResources } from '../../../hooks/useSortedResources';
import { Table } from '../../../shared';
import { Snapshot } from '../../../types/coreBuildService';
import SnapshotsListHeader, { SortableSnapshotHeaders } from './SnapshotsListHeader';
import SnapshotsListRow from './SnapshotsListRow';
import { SnapshotsListProps } from './types';

const sortPaths: Record<SortableSnapshotHeaders, string> = {
  [SortableSnapshotHeaders.name]: 'metadata.name',
  [SortableSnapshotHeaders.createdAt]: 'metadata.creationTimestamp',
  [SortableSnapshotHeaders.latestSuccessfulRelease]: 'status.conditions',
};

// Custom function to extract last successful release timestamp
const getLastSuccessfulReleaseTimestamp = (snapshot: Snapshot): string => {
  if (!snapshot.status?.conditions || snapshot.status.conditions.length === 0) {
    return '';
  }

  const successfulReleaseCondition = snapshot.status.conditions.find(
    (condition) => condition.status === 'True' && condition.reason?.toLowerCase() === 'passed',
  );

  return successfulReleaseCondition?.lastTransitionTime || '';
};

const SnapshotsList: React.FC<React.PropsWithChildren<SnapshotsListProps>> = ({
  snapshots,
  applicationName,
}) => {
  const [activeSortIndex, setActiveSortIndex] = React.useState<number>(
    SortableSnapshotHeaders.name,
  );
  const [activeSortDirection, setActiveSortDirection] = React.useState<SortByDirection>(
    SortByDirection.asc,
  );

  const SnapshotsListHeaderWithSorting = React.useMemo(
    () =>
      SnapshotsListHeader(activeSortIndex, activeSortDirection, (_, index, direction) => {
        setActiveSortIndex(index);
        setActiveSortDirection(direction);
      }),
    [activeSortIndex, activeSortDirection],
  );

  const defaultSortedSnapshots = useSortedResources(
    snapshots,
    activeSortIndex,
    activeSortDirection,
    sortPaths,
  );

  // Use custom sorting for latestSuccessfulRelease, fallback to useSortedResources for others
  const sortedSnapshots = React.useMemo(() => {
    if (activeSortIndex === SortableSnapshotHeaders.latestSuccessfulRelease) {
      const sorted = [...snapshots].sort((a, b) => {
        const timestampA = getLastSuccessfulReleaseTimestamp(a);
        const timestampB = getLastSuccessfulReleaseTimestamp(b);

        // Handle empty values - put them at the end
        if (!timestampA && !timestampB) return 0;
        if (!timestampA) return 1;
        if (!timestampB) return -1;

        return timestampA.localeCompare(timestampB);
      });

      return activeSortDirection === SortByDirection.desc ? sorted.reverse() : sorted;
    }

    return defaultSortedSnapshots;
  }, [snapshots, activeSortIndex, activeSortDirection, defaultSortedSnapshots]);

  return (
    <>
      <Table
        virtualize
        data={sortedSnapshots}
        aria-label="Snapshots List"
        Header={SnapshotsListHeaderWithSorting}
        Row={SnapshotsListRow}
        loaded
        customData={{ applicationName }}
        getRowProps={(obj: Snapshot) => ({
          id: `${obj.metadata.name}-snapshot-list-item`,
          'aria-label': obj.metadata.name,
        })}
      />
    </>
  );
};

export default SnapshotsList;
