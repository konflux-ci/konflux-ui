import { issuesPageLoader } from '~/components/Issues';
import { ISSUES_PATH } from '../paths';
import { RouteErrorBoundry } from '../RouteErrorBoundary';

const issuesRoutes = [
  /* Issues Page */
  {
    path: ISSUES_PATH.path,
    lazy: async () => {
      const { default: Component } = await import('~/components/Issues/Issues');
      return { Component };
    },
    errorElement: <RouteErrorBoundry />,
    children: [
      /* Issues Overview Tab */
      {
        index: true,
        loader: issuesPageLoader,
        lazy: async () => {
          const { default: Component } = await import('~/components/Issues/IssuesOverview');
          return { Component };
        },
        errorElement: <RouteErrorBoundry />,
      },
      /* Issues ListView Tab */
      {
        path: 'list',
        loader: issuesPageLoader,
        lazy: async () => {
          const { default: Component } = await import('~/components/Issues/IssuesListPage');
          return { Component };
        },
        errorElement: <RouteErrorBoundry />,
      },
    ],
  },
];

export default issuesRoutes;
