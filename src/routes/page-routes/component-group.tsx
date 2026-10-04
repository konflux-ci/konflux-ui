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
  ComponentGroupPipelineRunsTab,
  ComponentGroupIntegrationTestsTab,
} from '~/components/ComponentGroups/ComponentGroupDetails';
import {
  integrationDetailsPageLoader,
  IntegrationTestDetailsView,
  IntegrationTestOverviewTab,
  IntegrationTestPipelineRunTabV2,
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
      { index: true, element: <ComponentGroupPipelineRunsTab /> },
      {
        path: 'integrationtests',
        element: <ComponentGroupIntegrationTestsTab />,
      },
      {
        path: 'pipelineruns',
        element: <ComponentGroupPipelineRunsTab />,
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
      {
        path: 'pipelineruns',
        element: <IntegrationTestPipelineRunTabV2 />,
      },
    ],
  },
];

export default componentGroupRoutes;
