import { k8sQueryGetResource } from '../../../k8s';
import { IntegrationTestScenarioModel } from '../../../models';
import { RouterParams } from '../../../routes/utils';
import { createLoaderWithAccessCheck } from '../../../utils/rbac';

export const integrationDetailsPageLoader = createLoaderWithAccessCheck(
  async ({ params }) => {
    const ns = params[RouterParams.workspaceName];
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
export { default as IntegrationTestPipelineRunTab } from './tabs/IntegrationTestPipelineRunTab';
