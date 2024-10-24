import { SpaceBindingRequestModel } from '../../models';
import { createLoaderWithAccessCheck } from '../../utils/rbac';

export const userAccessListPageLoader = createLoaderWithAccessCheck(() => null, {
  model: SpaceBindingRequestModel,
  verb: 'list',
});

export const grantAccessPageLoader = createLoaderWithAccessCheck(() => null, {
  model: SpaceBindingRequestModel,
  verb: 'create',
});

export { default as UserAccessListPage } from './UserAccessListPage';
export { default as GrantAccessPage } from './UserAccessForm/GrantAccessPage';
export { default as EditAccessPage } from './UserAccessForm/EditAccessPage';
