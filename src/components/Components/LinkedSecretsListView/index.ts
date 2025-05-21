import { K8sQueryListResourceItems } from '../../../k8s';
import { SecretModel, ServiceAccountModel } from '../../../models';
import { RouterParams } from '../../../routes/utils';
import { createLoaderWithAccessCheck } from '../../../utils/rbac';

export const linkedSecretsListViewLoader = createLoaderWithAccessCheck(
  async ({ params }) => {
    const ns = params[RouterParams.workspaceName];
    return await K8sQueryListResourceItems({
      model: SecretModel,
      queryOptions: { ns },
    });
  },
  { model: ServiceAccountModel, verb: 'patch' },
);
