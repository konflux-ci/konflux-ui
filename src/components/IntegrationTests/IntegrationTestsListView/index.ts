import { K8sQueryListResourceItems } from '../../../k8s';
import { IntegrationTestScenarioModel } from '../../../models';
import { RouterParams } from '../../../routes/utils';
import { createLoaderWithAccessCheck } from '../../../utils/rbac';

export const integrationListPageLoader = createLoaderWithAccessCheck(
  async ({ params }) => {
    // console.log('integrationListPageLoader called with params:', params);
    return K8sQueryListResourceItems({
      model: IntegrationTestScenarioModel,
      queryOptions: { ns: params[RouterParams.workspaceName] },
    });
  },
  {
    model: IntegrationTestScenarioModel,
    verb: 'list',
  },
);

export { IntegrationTestsListView } from './IntegrationTestsListView';
