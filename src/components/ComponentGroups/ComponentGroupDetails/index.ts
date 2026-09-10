import { ensureFeatureFlagOnLoader } from '~/feature-flags/utils';
import { k8sQueryGetResource } from '~/k8s';
import { ComponentGroupModel } from '~/models';
import { RouterParams } from '~/routes/utils';
import { createLoaderWithAccessCheck } from '~/utils/rbac';

export const componentGroupDetailsViewLoader = createLoaderWithAccessCheck(
  ({ params }) => {
    ensureFeatureFlagOnLoader('component-model');

    const ns = params[RouterParams.workspaceName];

    return k8sQueryGetResource({
      model: ComponentGroupModel,
      queryOptions: {
        ns,
        name: params[RouterParams.groupName],
      },
    });
  },
  {
    model: ComponentGroupModel,
    verb: 'list',
  },
);

export { default as ComponentGroupDetailsViewLayout } from './ComponentGroupDetailsView';
export { default as ComponentGroupIntegrationTestsTab } from './tabs/ComponentGroupIntegrationTestsTab';
