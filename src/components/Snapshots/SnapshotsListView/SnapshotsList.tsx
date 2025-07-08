import * as React from 'react';
import { SortByDirection } from '@patternfly/react-table';
import { Table } from '../../../shared';
import { Snapshot } from '../../../types/coreBuildService';
import { createSnapshotsListHeader, SnapshotColumnKey } from './SnapshotsListHeader';
import SnapshotsListRow from './SnapshotsListRow';

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
  const [activeSortIndex, setActiveSortIndex] = React.useState<number>(0);
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

  return (
    <>
      <Table
        virtualize={false}
        data={snapshots}
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
