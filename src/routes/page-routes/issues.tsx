import React from 'react';
import { Spinner } from '@patternfly/react-core';
import { issuesPageLoader } from '~/components/Issues';
import { ISSUES_PATH } from '../paths';
import { RouteErrorBoundry } from '../RouteErrorBoundary';

const Issues = React.lazy(() => import('~/components/Issues/Issues'));
const IssuesListPage = React.lazy(() => import('~/components/Issues/IssuesListPage'));
const IssuesOverview = React.lazy(() => import('~/components/Issues/IssuesOverview'));

const LoadingSpinner: React.FC<{ message?: string }> = ({ message = 'Loading...' }) => (
  <div className="pf-v5-u-text-align-center pf-v5-u-p-xl">
    <Spinner size="lg" />
    <div className="pf-v5-u-mt-md">{message}</div>
  </div>
);

const issuesRoutes = [
  /* Issues Page */
  {
    key: 'index',
    path: ISSUES_PATH.path,
    element: (
      <React.Suspense fallback={<LoadingSpinner message="Loading Issues page..." />}>
        <Issues />
      </React.Suspense>
    ),
    errorElement: <RouteErrorBoundry />,
    children: [
      /* Issues Overview Tab */
      {
        index: true,
        loader: issuesPageLoader,
        element: (
          <React.Suspense fallback={<LoadingSpinner message="Loading Issues Overview..." />}>
            <IssuesOverview />
          </React.Suspense>
        ),
        errorElement: <RouteErrorBoundry />,
      },
      /* Issues ListView Tab */
      {
        path: 'list',
        loader: issuesPageLoader,
        element: (
          <React.Suspense fallback={<LoadingSpinner message="Loading Issues List..." />}>
            <IssuesListPage />
          </React.Suspense>
        ),
        errorElement: <RouteErrorBoundry />,
      },
    ],
  },
];

export default issuesRoutes;
