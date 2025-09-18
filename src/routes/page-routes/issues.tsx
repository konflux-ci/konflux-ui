import Issues from '~/components/Issues/Issues';
import { ISSUES_PATH } from '../paths';
import { RouteErrorBoundry } from '../RouteErrorBoundary';
import IssuesListPage from '~/components/Issues/IssuesListPage';
import { issuesPageLoader } from '~/components/Issues';
import IssuesOverview from '~/components/Issues/IssuesOverview';
const issuesRoutes = [
  /* Issues Page */
  {
    key: 'index',
    path: ISSUES_PATH.path,
    element: <Issues />,
    errorElement: <RouteErrorBoundry />,
    children: [
      {
        index: true,
        loader: issuesPageLoader,
        element: <IssuesOverview />,
        errorElement: <RouteErrorBoundry />,
      },
      /* Issues Overview Tab */
      {
        path: 'issues-overview',
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
