import Issues from '~/components/Issues/Issues';
import {  ISSUES_PATH, ISSUES_LIST_PATH } from '../paths';
import { RouteErrorBoundry } from '../RouteErrorBoundary';
import IssuesListPage from '~/components/Issues/IssuesListPage';
import { issuesPageLoader } from '~/components/Issues';

const issuesRoutes = [
  /* Issues Overview Tab */
  {
    path: ISSUES_PATH.path,
    element: <Issues />,
    errorElement: <RouteErrorBoundry />,
  },
  /* Issues List View */
  {
    path: ISSUES_LIST_PATH.path,
    loader: issuesPageLoader,
    element: <IssuesListPage/>,
    errorElement: <RouteErrorBoundry />,
  },
];

export default issuesRoutes;
