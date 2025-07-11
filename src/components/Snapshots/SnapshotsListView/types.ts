import { RowFunctionArgs } from '~/shared';
import { Snapshot } from '../../../types/coreBuildService';

export type SnapshotsListViewProps = {
  applicationName: string;
};

export type SnapshotsListProps = {
  snapshots: Snapshot[];
  applicationName: string;
};

export type SnapshotsListRowProps = RowFunctionArgs<Snapshot> & {
  customData?: {
    applicationName: string;
  };
};
