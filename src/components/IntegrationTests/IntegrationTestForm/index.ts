import { LoaderFunctionArgs } from 'react-router-dom';
import { k8sQueryGetResource } from '../../../k8s';
import { IntegrationTestScenarioModel } from '../../../models';
import { RouterParams } from '../../../routes/utils';
import { createLoaderWithAccessCheck } from '../../../utils/rbac';

export const integrationTestCreateFormLoader = createLoaderWithAccessCheck(() => null, {
  model: IntegrationTestScenarioModel,
  verb: 'create',
});

export const integrationTestEditFormLoader = createLoaderWithAccessCheck(
  async ({ params }: LoaderFunctionArgs) => {
    const ns = params[RouterParams.workspaceName];
    return k8sQueryGetResource({
      model: IntegrationTestScenarioModel,
      queryOptions: {
        ns,
        ws: params[RouterParams.workspaceName],
        name: params[RouterParams.integrationTestName],
      },
    });
  },
  {
    model: IntegrationTestScenarioModel,
    verb: 'update',
  },
);

export * from './IntegrationTestCreateForm';
export * from './IntegrationTestEditForm';
