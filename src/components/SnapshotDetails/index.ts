import { k8sQueryGetResource } from '../../k8s';
import { SnapshotModel } from '../../models';
import { RouterParams } from '../../routes/utils';
import { createLoaderWithAccessCheck } from '../../utils/rbac';

export const snapshotDetailsViewLoader = createLoaderWithAccessCheck(
  async ({ params }) => {
    const ns = params[RouterParams.workspaceName];
    return k8sQueryGetResource({
      model: SnapshotModel,
      queryOptions: {
        ns,
        ws: params[RouterParams.workspaceName],
        name: params[RouterParams.snapshotName],
      },
    });
  },
  { model: SnapshotModel, verb: 'get' },
);

export { default as SnapshotDetailsView } from './SnapshotDetailsView';
export { default as SnapshotOverviewTab } from './tabs/SnapshotOverview';
export { default as SnapshotPipelineRunsTab } from './tabs/SnapshotPipelineRunsTab';
