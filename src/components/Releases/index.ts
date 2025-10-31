import { PipelineRunLabel } from '~/consts/pipelinerun';
import { k8sQueryGetResource, K8sQueryListResourceItems } from '../../k8s';
import { ReleaseModel } from '../../models';
import { RouterParams } from '../../routes/utils';
import { getLastUsedNamespace } from '../../shared/providers/Namespace/utils';
import { createLoaderWithAccessCheck } from '../../utils/rbac';

export const releaseListViewTabLoader = createLoaderWithAccessCheck(
  async ({ params }) => {
    const ns = params[RouterParams.workspaceName];
    const applicationName = params[RouterParams.applicationName];
    return K8sQueryListResourceItems({
      model: ReleaseModel,
      queryOptions: {
        ns,
        queryParams: { matchLabels: { [PipelineRunLabel.APPLICATION]: applicationName } },
      },
    });
  },
  { model: ReleaseModel, verb: 'list' },
);

export const releaseDetailsViewLoader = createLoaderWithAccessCheck(
  async ({ params }) => {
    const ns = getLastUsedNamespace();
    return k8sQueryGetResource({
      model: ReleaseModel,
      queryOptions: {
        ns,
        name: params[RouterParams.releaseName],
      },
    });
  },
  { model: ReleaseModel, verb: 'list' },
);

export { default as ReleaseOverviewTab } from './ReleaseOverviewTab';
export { default as ReleaseDetailsLayout } from './ReleaseDetailsView';
export { default as ReleaseListViewTab } from './ReleasesListView';
export { default as ReleasePipelineRunTab } from './ReleasePipelineRunTab';
