import { RoleBindingModel, SpaceBindingRequestModel } from '../../models';
import { createLoaderWithAccessCheck } from '../../utils/rbac';

export const userAccessListPageLoader = createLoaderWithAccessCheck(() => null, {
  model: SpaceBindingRequestModel,
  verb: 'list',
});

export const grantAccessPageLoader = createLoaderWithAccessCheck(() => null, {
  model: SpaceBindingRequestModel,
  verb: 'create',
});

// We delete and create roles which looks like 'patch'.
export const editAccessPageLoader = createLoaderWithAccessCheck(() => null, {
  model: RoleBindingModel,
  verb: 'patch',
});

export { default as UserAccessListPage } from './UserAccessListPage';
export { default as GrantAccessPage } from './UserAccessForm/GrantAccessPage';
export { default as EditAccessPage } from './UserAccessForm/EditAccessPage';
