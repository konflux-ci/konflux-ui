import { k8sQueryGetResource, K8sQueryListResourceItems } from '../../k8s';
import { ReleaseModel } from '../../models';
import { RouterParams } from '../../routes/utils';
import { createLoaderWithAccessCheck } from '../../utils/rbac';
import { getNamespaceUsingWorspaceFromQueryCache } from '../Workspace/utils';

export const releaseListViewTabLoader = createLoaderWithAccessCheck(
  async ({ params }) => {
    const ns = await getNamespaceUsingWorspaceFromQueryCache(params[RouterParams.workspaceName]);
    return K8sQueryListResourceItems({
      model: ReleaseModel,
      queryOptions: { ns, ws: params[RouterParams.workspaceName] },
    });
  },
  { model: ReleaseModel, verb: 'list' },
);

export const releaseDetailsViewLoader = createLoaderWithAccessCheck(
  async ({ params }) => {
    const ns = await getNamespaceUsingWorspaceFromQueryCache(params[RouterParams.workspaceName]);
    return k8sQueryGetResource({
      model: ReleaseModel,
      queryOptions: {
        ns,
        ws: params[RouterParams.workspaceName],
        name: params[RouterParams.releaseName],
      },
    });
  },
  { model: ReleaseModel, verb: 'list' },
);

export { default as ReleaseOverviewTab } from './ReleaseOverviewTab';
export { default as ReleaseDetailsLayout } from './ReleaseDetailsView';
export { default as ReleaseListViewTab } from './ReleasesListView';
