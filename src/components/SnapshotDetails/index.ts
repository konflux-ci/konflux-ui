import { HttpError } from '~/k8s/error';
import { fetchResourceWithK8sAndKubeArchive } from '~/kubearchive/resource-utils';
import { Snapshot } from '~/types/coreBuildService';
import { SnapshotModel } from '../../models';
import { RouterParams } from '../../routes/utils';
import { createLoaderWithAccessCheck } from '../../utils/rbac';

export const snapshotDetailsViewLoader = createLoaderWithAccessCheck(
  async ({ params }) => {
    const ns = params[RouterParams.workspaceName];

    return fetchResourceWithK8sAndKubeArchive<Snapshot>({
      model: SnapshotModel,
      queryOptions: {
        ns,
        name: params[RouterParams.snapshotName],
      },
    }).then(({ resource }) => {
      const groupName = params[RouterParams.groupName];
      if (groupName && resource.spec.componentGroup !== groupName) throw HttpError.fromCode(404);
      return resource;
    });
  },
  { model: SnapshotModel, verb: 'get' },
);

export { default as SnapshotDetailsView } from './SnapshotDetailsView';
export { default as SnapshotOverviewTab } from './tabs/SnapshotOverview';
export { default as SnapshotPipelineRunsTab } from './tabs/SnapshotPipelineRunsTab';
