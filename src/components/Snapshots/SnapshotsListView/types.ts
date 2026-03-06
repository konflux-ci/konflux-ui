import { RowFunctionArgs } from '~/shared';
import { Snapshot } from '../../../types/coreBuildService';
import { K8sResourceCommon, ResourceSource } from '../../../types/k8s';

export type SnapshotsListViewProps = {
  applicationName: string;
};

export type SnapshotsListProps = {
  snapshots: Snapshot[];
  applicationName: string;
  getSource: (resource: K8sResourceCommon) => ResourceSource | undefined;
  infiniteLoadingProps?: {
    hasNextPage: boolean;
    isFetchingNextPage: boolean;
    fetchNextPage: () => void;
  };
};

export type SnapshotsListRowProps = RowFunctionArgs<Snapshot> & {
  customData?: {
    applicationName: string;
    getSource?: (resource: K8sResourceCommon) => ResourceSource | undefined;
  };
};
