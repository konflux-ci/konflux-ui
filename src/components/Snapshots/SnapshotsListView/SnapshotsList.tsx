import * as React from 'react';
import { SortByDirection } from '@patternfly/react-table';
import { useSortedResources } from '../../../hooks/useSortedResources';
import { Table } from '../../../shared';
import { Snapshot } from '../../../types/coreBuildService';
import { createSnapshotsListHeader, SnapshotColumnKey } from './SnapshotsListHeader';
import SnapshotsListRow from './SnapshotsListRow';

export const enum SortableSnapshotHeaders {
  name = 0,
  createdAt = 1,
}

const sortPaths: Record<SortableSnapshotHeaders, string> = {
  [SortableSnapshotHeaders.name]: 'metadata.name',
  [SortableSnapshotHeaders.createdAt]: 'metadata.creationTimestamp',
};

type SnapshotsListProps = {
  snapshots: Snapshot[];
  applicationName: string;
  visibleColumns: Set<SnapshotColumnKey>;
  isColumnVisible: (columnKey: SnapshotColumnKey) => boolean;
};

const SnapshotsList: React.FC<React.PropsWithChildren<SnapshotsListProps>> = ({
  snapshots,
  applicationName,
  visibleColumns,
  isColumnVisible,
}) => {
  const [activeSortIndex, setActiveSortIndex] = React.useState<number>(
    SortableSnapshotHeaders.name,
  );
  const [activeSortDirection, setActiveSortDirection] = React.useState<SortByDirection>(
    SortByDirection.asc,
  );

  const SnapshotsListHeader = React.useMemo(
    () =>
      createSnapshotsListHeader(visibleColumns)(
        activeSortIndex,
        activeSortDirection,
        (_, index, direction) => {
          setActiveSortIndex(index);
          setActiveSortDirection(direction);
        },
      ),
    [visibleColumns, activeSortIndex, activeSortDirection],
  );

  const sortedSnapshots = useSortedResources(
    snapshots,
    activeSortIndex,
    activeSortDirection,
    sortPaths,
  );

  return (
    <>
      <Table
        virtualize={false}
        data={sortedSnapshots}
        aria-label="Snapshots List"
        Header={SnapshotsListHeader}
        Row={SnapshotsListRow}
        loaded
        customData={{ applicationName, isColumnVisible }}
        getRowProps={(obj: Snapshot) => ({
          id: `${obj.metadata.name}-snapshot-list-item`,
          'aria-label': obj.metadata.name,
        })}
      />
    </>
  );
};

export default SnapshotsList;
