import { RowFunctionArgs } from '~/shared';
import { Snapshot } from '../../../types/coreBuildService';
import { snapshotsTableColumnClasses } from './SnapshotsListHeader';

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
