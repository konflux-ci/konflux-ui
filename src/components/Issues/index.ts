import { IssuesModel } from '~/models/issues';
import { createLoaderWithAccessCheck } from '../../utils/rbac';

export const issuesPageLoader = createLoaderWithAccessCheck(
  () => null,
  [
    { model: IssuesModel, verb: 'create' },
   
  ],
);

export { default as Issues } from './Issues';
export { default as IssuesListPage } from './IssuesListPage';
