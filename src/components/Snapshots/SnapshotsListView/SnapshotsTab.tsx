import { useParams } from 'react-router-dom';
import { SnapshotModel } from '~/models';
import { RouterParams } from '~/routes/utils';
import { NuqsAdapter } from '~/shared/components/Filter';
import { createLoaderWithAccessCheck } from '~/utils/rbac';
import { default as SnapshotsListView } from './SnapshotsListView';

export const snapshotsTabLoader = createLoaderWithAccessCheck(
  () => {
    // Data loading is handled by useK8sAndKarchResources hook in the component
    return null;
  },
  { model: SnapshotModel, verb: 'list' },
);

export const SnapshotsListViewTab: React.FC = () => {
  const { applicationName } = useParams<RouterParams>();
  return (
    <NuqsAdapter>
      <SnapshotsListView applicationName={applicationName} />
    </NuqsAdapter>
  );
};

export default SnapshotsListView;
