import { GROUP_DETAILS_PATH, GROUPS_PATH } from '@routes/paths';
import { RouteErrorBoundry } from '@routes/RouteErrorBoundary';
import {
  ComponentGroupDetailsViewLayout,
  componentGroupDetailsViewLoader,
  ComponentGroupIntegrationTestsTab,
} from '~/components/ComponentGroups/ComponentGroupDetails';
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
];

export default componentGroupRoutes;
