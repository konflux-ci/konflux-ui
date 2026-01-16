import { RowFunctionArgs } from '~/shared';
import { ResourceSource } from '~/types/k8s';
import { Snapshot } from '../../../types/coreBuildService';

export type SnapshotsListViewProps = {
  applicationName: string;
};

export type SnapshotsListProps = {
  snapshots: Snapshot[];
  getSource: (snapshot: Snapshot) => ResourceSource | undefined;
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
    getSource: (snapshot: Snapshot) => ResourceSource | undefined;
  };
};
