import { issuesPageLoader } from '~/components/Issues';
import Issues from '~/components/Issues/Issues';
import IssuesListPage from '~/components/Issues/IssuesListPage';
import IssuesOverview from '~/components/Issues/IssuesOverview';
import { ISSUES_PATH } from '../paths';
import { RouteErrorBoundry } from '../RouteErrorBoundary';

const issuesRoutes = [
  /* Issues Page */
  {
    key: 'index',
    path: ISSUES_PATH.path,
    element: <Issues />,
    errorElement: <RouteErrorBoundry />,
    children: [
      /* Issues Overview Tab */
      {
        index: true,
        loader: issuesPageLoader,
        element: <IssuesOverview />,
        errorElement: <RouteErrorBoundry />,
      },
      /* Issues ListView Tab */
      {
        path: 'issues-list',
        loader: issuesPageLoader,
        element: <IssuesListPage />,
        errorElement: <RouteErrorBoundry />,
      },
    ],
  },
];

export default issuesRoutes;
