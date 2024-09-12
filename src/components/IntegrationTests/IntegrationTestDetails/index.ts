import { k8sQueryGetResource } from '../../../k8s';
import { IntegrationTestScenarioModel } from '../../../models';
import { RouterParams } from '../../../routes/utils';
import { createLoaderWithAccessCheck } from '../../../utils/rbac';
import { getNamespaceUsingWorspaceFromQueryCache } from '../../Workspace/utils';

export const integrationDetailsPageLoader = createLoaderWithAccessCheck(
  async ({ params }) => {
    const ns = await getNamespaceUsingWorspaceFromQueryCache(params[RouterParams.workspaceName]);
    return k8sQueryGetResource({
      model: IntegrationTestScenarioModel,
      queryOptions: {
        ws: params[RouterParams.workspaceName],
        ns,
        name: params[RouterParams.integrationTestName],
      },
    });
  },
  {
    model: IntegrationTestScenarioModel,
    verb: 'get',
  },
);

export { default as IntegrationTestDetailsView } from './IntegrationTestDetailsView';
export { default as IntegrationTestOverviewTab } from './tabs/IntegrationTestOverviewTab';
