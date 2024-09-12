import { K8sQueryListResourceItems } from '../../../k8s';
import { IntegrationTestScenarioModel } from '../../../models';
import { RouterParams } from '../../../routes/utils';
import { createLoaderWithAccessCheck } from '../../../utils/rbac';
import { getNamespaceUsingWorspaceFromQueryCache } from '../../Workspace/utils';

export const integrationListPageLoader = createLoaderWithAccessCheck(
  async ({ params }) => {
    const ns = await getNamespaceUsingWorspaceFromQueryCache(params[RouterParams.workspaceName]);
    return K8sQueryListResourceItems({
      model: IntegrationTestScenarioModel,
      queryOptions: { ns, ws: params[RouterParams.workspaceName] },
    });
  },
  {
    model: IntegrationTestScenarioModel,
    verb: 'list',
  },
);

export { default as IntegrationTestsListView } from './IntegrationTestsListView';
