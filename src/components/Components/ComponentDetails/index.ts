import { k8sQueryGetResource } from '../../../k8s';
import { ComponentModel } from '../../../models';
import { RouterParams } from '../../../routes/utils';
import { createLoaderWithAccessCheck } from '../../../utils/rbac';

export const componentDetailsViewLoader = createLoaderWithAccessCheck(
  async ({ params }) => {
    const ns = params[RouterParams.workspaceName];
    return k8sQueryGetResource({
      model: ComponentModel,
      queryOptions: {
        ns,
        name: params[RouterParams.componentName],
      },
    });
  },
  {
    model: ComponentModel,
    verb: 'list',
  },
);

export { default as ComponentDetailsViewLayout } from './ComponentDetailsView';
export { default as ComponentDetailsTab } from './tabs/ComponentDetailsTab';
export { default as ComponentActivityTab } from './tabs/ComponentActivityTab';
