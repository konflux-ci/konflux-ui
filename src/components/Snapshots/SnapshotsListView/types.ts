import { RowFunctionArgs } from '~/shared';
import { snapshotsTableColumnClasses } from '../../../consts/snapshots';
import { Snapshot } from '../../../types/coreBuildService';

export type SnapshotsListViewProps = {
  applicationName: string;
};

export type SnapshotsListProps = {
  snapshots: Snapshot[];
  applicationName: string;
  visibleColumns: Set<SnapshotColumnKey>;
  isColumnVisible: (columnKey: SnapshotColumnKey) => boolean;
};

export type SnapshotsListRowProps = RowFunctionArgs<Snapshot> & {
  customData?: {
    applicationName: string;
    isColumnVisible: (columnKey: string) => boolean;
  };
};

export type SnapshotColumnKey = keyof typeof snapshotsTableColumnClasses;
