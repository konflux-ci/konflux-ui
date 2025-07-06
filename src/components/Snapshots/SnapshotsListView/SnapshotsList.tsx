import * as React from 'react';
import { Table } from '../../../shared';
import { Snapshot } from '../../../types/coreBuildService';
import SnapshotsListHeader from './SnapshotsListHeader';
import SnapshotsListRow from './SnapshotsListRow';

type SnapshotsListProps = {
  snapshots: Snapshot[];
  applicationName: string;
};

const SnapshotsList: React.FC<React.PropsWithChildren<SnapshotsListProps>> = ({
  snapshots,
  applicationName,
}) => {
  return (
    <>
      <Table
        virtualize={false}
        data={snapshots}
        aria-label="Snapshots List"
        Header={SnapshotsListHeader}
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
