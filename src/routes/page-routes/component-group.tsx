import {
  GROUP_DETAILS_PATH,
  GROUPS_PATH,
  GROUP_INTEGRATION_TEST_DETAILS_PATH,
  GROUP_INTEGRATION_TEST_ADD_PATH,
  GROUP_INTEGRATION_TEST_EDIT_PATH,
} from '@routes/paths';
import { RouteErrorBoundry } from '@routes/RouteErrorBoundary';
import {
  ComponentGroupDetailsViewLayout,
  componentGroupDetailsViewLoader,
  ComponentGroupIntegrationTestsTab,
} from '~/components/ComponentGroups/ComponentGroupDetails';
import {
  integrationDetailsPageLoader,
  IntegrationTestDetailsByGroup,
  IntegrationTestOverviewTabByGroup,
  IntegrationTestPipelineRunTabByGroup,
} from '~/components/IntegrationTests/IntegrationTestDetails';
import {
  IntegrationTestCreateFormByGroup,
  integrationTestCreateFormLoader,
  IntegrationTestEditFormByGroup,
  integrationTestEditFormLoader,
} from '~/components/IntegrationTests/IntegrationTestForm';
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
      {
        index: true,
        element: null,
      },
      {
        path: 'integrationtests',
        element: <ComponentGroupIntegrationTestsTab />,
      },
    ],
  },
  {
    path: GROUP_INTEGRATION_TEST_ADD_PATH.path,
    loader: integrationTestCreateFormLoader,
    errorElement: <RouteErrorBoundry />,
    element: <IntegrationTestCreateFormByGroup />,
  },
  {
    path: GROUP_INTEGRATION_TEST_EDIT_PATH.path,
    loader: integrationTestEditFormLoader,
    errorElement: <RouteErrorBoundry />,
    element: <IntegrationTestEditFormByGroup />,
  },
  {
    path: GROUP_INTEGRATION_TEST_DETAILS_PATH.path,
    loader: integrationDetailsPageLoader,
    errorElement: <RouteErrorBoundry />,
    element: <IntegrationTestDetailsByGroup />,
    children: [
      {
        index: true,
        element: <IntegrationTestOverviewTabByGroup />,
      },
      {
        path: 'pipelineruns',
        element: <IntegrationTestPipelineRunTabByGroup />,
      },
    ],
  },
];

export default componentGroupRoutes;
