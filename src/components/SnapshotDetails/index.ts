import { fetchResourceWithK8sAndKubeArchive } from '~/kubearchive/resource-utils';
import { SnapshotModel } from '../../models';
import { RouterParams } from '../../routes/utils';
import { createLoaderWithAccessCheck } from '../../utils/rbac';

export const snapshotDetailsViewLoader = createLoaderWithAccessCheck(
  async ({ params }) => {
    const ns = params[RouterParams.workspaceName];

    return fetchResourceWithK8sAndKubeArchive({
      model: SnapshotModel,
      queryOptions: {
        ns,
        name: params[RouterParams.snapshotName],
      },
    }).then((result) => result.resource);
  },
  { model: SnapshotModel, verb: 'get' },
);

export { default as SnapshotDetailsView } from './SnapshotDetailsView';
export { default as SnapshotOverviewTab } from './tabs/SnapshotOverview';
export { default as SnapshotPipelineRunsTab } from './tabs/SnapshotPipelineRunsTab';
