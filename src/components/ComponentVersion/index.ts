import { k8sQueryGetResource } from '~/k8s';
import { ComponentModelV2 } from '~/models';
import { RouterParams } from '~/routes/utils';
import { createLoaderWithAccessCheck } from '~/utils/rbac';

export const componentVersionDetailsViewLoader = createLoaderWithAccessCheck(
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

export { default as ComponentVersionDetailsViewLayout } from './ComponentVersionDetailsView';
