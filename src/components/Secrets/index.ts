import { K8sQueryListResourceItems } from '../../k8s';
import { SecretModel } from '../../models';
import { RouterParams } from '../../routes/utils';
import { createLoaderWithAccessCheck } from '../../utils/rbac';
import { getNamespaceUsingWorspaceFromQueryCache } from '../Workspace/utils';

export const secretListViewLoader = createLoaderWithAccessCheck(
  async ({ params }) => {
    const ns = await getNamespaceUsingWorspaceFromQueryCache(params[RouterParams.workspaceName]);
    return await K8sQueryListResourceItems({
      model: SecretModel,
      queryOptions: { ns, ws: params[RouterParams.workspaceName] },
    });
  },
  { model: SecretModel, verb: 'list' },
);

export { default as AddSecretForm } from './SecretsForm/AddSecretForm';
export { default as SecretsListPage } from './SecretsListPage';
