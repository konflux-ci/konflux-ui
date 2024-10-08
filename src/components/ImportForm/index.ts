import { ApplicationModel, ComponentModel } from '../../models';
import { createLoaderWithAccessCheck } from '../../utils/rbac';

export const importPageLoader = createLoaderWithAccessCheck(
  () => null,
  [
    { model: ApplicationModel, verb: 'create' },
    { model: ComponentModel, verb: 'create' },
  ],
);

export { default as ImportForm } from './ImportForm';
