import { RoleBindingModel } from '../../models';
import { createLoaderWithAccessCheck } from '../../utils/rbac';

export const userAccessListPageLoader = createLoaderWithAccessCheck(() => null, {
  model: RoleBindingModel,
  verb: 'list',
});

export const grantAccessPageLoader = createLoaderWithAccessCheck(() => null, {
  model: RoleBindingModel,
  verb: 'create',
});

export { default as UserAccessListPage } from './UserAccessListPage';
export { default as GrantAccessPage } from './UserAccessForm/GrantAccessPage';
export { default as EditAccessPage } from './UserAccessForm/EditAccessPage';
