import { k8sQueryGetResource } from '~/k8s';
import { ComponentModelV2 } from '~/models';
import { RouterParams } from '~/routes/utils';
import { createLoaderWithAccessCheck } from '~/utils/rbac';

export const componentDetailsViewLoader = createLoaderWithAccessCheck(
  async ({ params }) => {
    const ns = params[RouterParams.workspaceName];
    return k8sQueryGetResource({
      model: ComponentModelV2,
      queryOptions: {
        ns,
        name: params[RouterParams.componentName],
      },
    });
  },
  {
    model: ComponentModelV2,
    verb: 'get',
  },
);

export { default as ComponentDetailsViewLayout } from './ComponentDetailsView';
export { default as ComponentDetailsTab } from './ComponentDetailsTab';
