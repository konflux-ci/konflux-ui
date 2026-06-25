import { K8sQuerySecretListTableItems } from '~/utils/secrets/secret-table-query';
import { ServiceAccountModel } from '../../../models';
import { RouterParams } from '../../../routes/utils';
import { createLoaderWithAccessCheck } from '../../../utils/rbac';

export const linkedSecretsListViewLoader = createLoaderWithAccessCheck(
  async ({ params }) => {
    const ns = params[RouterParams.workspaceName];
    return await K8sQuerySecretListTableItems(ns);
  },
  { model: ServiceAccountModel, verb: 'patch' },
);
