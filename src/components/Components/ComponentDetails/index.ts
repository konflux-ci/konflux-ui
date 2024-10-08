import { k8sQueryGetResource } from '../../../k8s';
import { ComponentModel } from '../../../models';
import { RouterParams } from '../../../routes/utils';
import { createLoaderWithAccessCheck } from '../../../utils/rbac';
import { getNamespaceUsingWorspaceFromQueryCache } from '../../Workspace/utils';

export const componentDetailsViewLoader = createLoaderWithAccessCheck(
  async ({ params }) => {
    const ns = await getNamespaceUsingWorspaceFromQueryCache(params[RouterParams.workspaceName]);
    return k8sQueryGetResource({
      model: ComponentModel,
      queryOptions: {
        ns,
        ws: params[RouterParams.workspaceName],
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
