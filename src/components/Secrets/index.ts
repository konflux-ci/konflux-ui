import { K8sQuerySecretListTableItems } from '../../k8s/secret-table';
import { SecretModel } from '../../models';
import { RouterParams } from '../../routes/utils';
import { createLoaderWithAccessCheck } from '../../utils/rbac';

export const secretListViewLoader = createLoaderWithAccessCheck(
  async ({ params }) => {
    const ns = params[RouterParams.workspaceName];
    return await K8sQuerySecretListTableItems(ns);
  },
  { model: SecretModel, verb: 'list' },
);

export { default as AddSecretForm } from './SecretsForm/AddSecretForm';
export { default as EditSecretForm } from './SecretsForm/EditSecretForm';
export { default as SecretsListPage } from './SecretsListPage';
