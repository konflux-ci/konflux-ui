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

export { default as IntegrationTestDetailsByApplication } from './IntegrationTestDetailsByApplication';
export { default as IntegrationTestDetailsByGroup } from './IntegrationTestDetailsByGroup';
export { default as IntegrationTestOverviewTabByApplication } from './tabs/IntegrationTestOverviewTabByApplication';
export { default as IntegrationTestOverviewTabByGroup } from './tabs/IntegrationTestOverviewTabByGroup';
export { default as IntegrationTestPipelineRunTabByApplication } from './tabs/IntegrationTestPipelineRunTabByApplication';
export { default as IntegrationTestPipelineRunTabByGroup } from './tabs/IntegrationTestPipelineRunTabByGroup';
