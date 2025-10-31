import { RowFunctionArgs } from '~/shared';
import { Snapshot } from '../../../types/coreBuildService';

export type SnapshotsListViewProps = {
  applicationName: string;
};

export type SnapshotsListProps = {
  snapshots: Snapshot[];
  applicationName: string;
  infiniteLoadingProps?: {
    hasNextPage: boolean;
    isFetchingNextPage: boolean;
    fetchNextPage: () => void;
  };
};

export type SnapshotsListRowProps = RowFunctionArgs<Snapshot> & {
  customData?: {
    applicationName: string;
  };
};
