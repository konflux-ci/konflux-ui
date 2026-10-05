import { LoaderFunctionArgs } from 'react-router-dom';
import {
  GROUP_DETAILS_PATH,
  GROUPS_PATH,
  GROUP_INTEGRATION_TEST_DETAILS_PATH,
} from '@routes/paths';
import { RouteErrorBoundry } from '@routes/RouteErrorBoundary';
import {
  ComponentGroupDetailsViewLayout,
  componentGroupDetailsViewLoader,
  ComponentGroupReleasesTab,
  ComponentGroupIntegrationTestsTab,
} from '~/components/ComponentGroups/ComponentGroupDetails';
import {
  integrationDetailsPageLoader,
  IntegrationTestDetailsView,
  IntegrationTestOverviewTab,
} from '~/components/IntegrationTests/IntegrationTestDetails';
import { ensureFeatureFlagOnLoader } from '~/feature-flags/utils';

const componentGroupRoutes = [
  {
    path: GROUPS_PATH.path,
    errorElement: <RouteErrorBoundry />,
    async lazy() {
      ensureFeatureFlagOnLoader('component-model');
      const { ComponentGroupsListView: Component } = await import(
        '~/components/ComponentGroups/ComponentGroupsListView/ComponentGroupsListView' /* webpackChunkName: "component-groups" */
      );

      return { Component };
    },
  },
  {
    path: GROUP_DETAILS_PATH.path,
    loader: componentGroupDetailsViewLoader,
    errorElement: <RouteErrorBoundry />,
    element: <ComponentGroupDetailsViewLayout />,
    children: [
      { index: true, element: <ComponentGroupIntegrationTestsTab /> },
      {
        path: 'integrationtests',
        element: <ComponentGroupIntegrationTestsTab />,
      },
      {
        path: 'releases',
        element: <ComponentGroupReleasesTab />,
      },
    ],
  },
  {
    path: GROUP_INTEGRATION_TEST_DETAILS_PATH.path,
    loader: (args: LoaderFunctionArgs) => {
      ensureFeatureFlagOnLoader('component-model');
      return integrationDetailsPageLoader(args);
    },
    errorElement: <RouteErrorBoundry />,
    element: <IntegrationTestDetailsView />,
    children: [
      {
        index: true,
        element: <IntegrationTestOverviewTab />,
      },
    ],
  },
];

export default componentGroupRoutes;
