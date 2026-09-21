import { redirect } from 'react-router-dom';
import { GROUP_DETAILS_PATH, GROUPS_PATH } from '@routes/paths';
import { RouteErrorBoundry } from '@routes/RouteErrorBoundary';
import {
  ComponentGroupComponentsTab,
  ComponentGroupDetailsViewLayout,
  componentGroupDetailsViewLoader,
} from '~/components/ComponentGroups/ComponentGroupsDetails';
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
        loader: () => redirect('components'),
      },
      {
        path: 'components',
        element: <ComponentGroupComponentsTab />,
      },
    ],
  },
];

export default componentGroupRoutes;
