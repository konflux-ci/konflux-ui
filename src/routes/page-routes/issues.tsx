import { issuesPageLoader } from '~/components/Issues';
import { ensureConditionOnLoader } from '~/feature-flags/utils';
import { ISSUES_PATH } from '../paths';
import { RouteErrorBoundry } from '../RouteErrorBoundary';

const issuesRoutes = [
  /* Issues Page */
  {
    path: ISSUES_PATH.path,
    lazy: async () => {
      await ensureConditionOnLoader(['isKiteServiceEnabled'], {
        errorMessage: 'Issues dashboard is unavailable on the cluster.',
      });
      const { default: Component } = await import(
        '~/components/Issues/Issues' /* webpackChunkName: "issues" */
      );
      return { Component };
    },
    errorElement: <RouteErrorBoundry />,
    children: [
      /* Issues Overview Tab */
      {
        index: true,
        loader: issuesPageLoader,
        lazy: async () => {
          const { default: Component } = await import(
            '~/components/Issues/IssuesOverview' /* webpackChunkName: "issues-overview" */
          );
          return { Component };
        },
        errorElement: <RouteErrorBoundry />,
      },
      /* Issues ListView Tab */
      {
        path: 'list',
        loader: issuesPageLoader,
        lazy: async () => {
          const { default: Component } = await import(
            '~/components/Issues/IssuesListPage' /* webpackChunkName: "issues-list-page" */
          );
          return { Component };
        },
        errorElement: <RouteErrorBoundry />,
      },
    ],
  },
];

export default issuesRoutes;
