import { useParams } from 'react-router-dom';
import { FilterContextProvider } from '~/components/Filter/generic/FilterContext';
import { K8sQueryListResourceItems } from '../../../k8s';
import { SnapshotModel } from '../../../models';
import { RouterParams } from '../../../routes/utils';
import { createLoaderWithAccessCheck } from '../../../utils/rbac';
import { default as SnapshotsListView } from './SnapshotsListView';

export const snapshotsTabLoader = createLoaderWithAccessCheck(
  async ({ params }) => {
    const ns = params[RouterParams.workspaceName];
    return K8sQueryListResourceItems({
      model: SnapshotModel,
      queryOptions: { ns },
    });
  },
  { model: SnapshotModel, verb: 'list' },
);

export const SnapshotsListViewTab: React.FC = () => {
  const { applicationName } = useParams<RouterParams>();
  return (
    <FilterContextProvider filterParams={['name']}>
      <SnapshotsListView applicationName={applicationName} />
    </FilterContextProvider>
  );
};

export default SnapshotsListView;
