import { redirect, type LoaderFunctionArgs } from 'react-router-dom';
import {
  GROUP_DETAILS_PATH,
  GROUP_SNAPSHOT_DETAILS_PATH,
  GROUPS_PATH,
  GROUP_INTEGRATION_TEST_DETAILS_PATH,
} from '@routes/paths';
import { RouteErrorBoundry } from '@routes/RouteErrorBoundary';
import {
  ComponentGroupComponentsTab,
  ComponentGroupDetailsViewLayout,
  componentGroupDetailsViewLoader,
  ComponentGroupReleasesTab,
  ComponentGroupPipelineRunsTab,
  ComponentGroupIntegrationTestsTab,
} from '~/components/ComponentGroups/ComponentGroupDetails';
import { ComponentGroupSnapshotsTab } from '~/components/ComponentGroups/ComponentGroupDetails/tabs/ComponentGroupSnapshotsTab';
import {
  integrationDetailsPageLoader,
  IntegrationTestDetailsView,
  IntegrationTestOverviewTab,
  IntegrationTestPipelineRunTabV2,
} from '~/components/IntegrationTests/IntegrationTestDetails';
import {
  GroupSnapshotDetailsView,
  snapshotDetailsViewLoader,
  GroupSnapshotOverview,
} from '~/components/SnapshotDetails';
import { snapshotsTabLoader } from '~/components/Snapshots/SnapshotsListView/SnapshotsTab';
import { ensureFeatureFlagOnLoader } from '~/feature-flags/utils';

const componentGroupRoutes = [
  {
    path: GROUP_SNAPSHOT_DETAILS_PATH.path,
    loader: (args: LoaderFunctionArgs) => {
      ensureFeatureFlagOnLoader('component-model');
      return snapshotDetailsViewLoader(args);
    },
    errorElement: <RouteErrorBoundry />,
    element: <GroupSnapshotDetailsView />,
    children: [{ index: true, element: <GroupSnapshotOverview /> }],
  },
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
      {
        path: 'integrationtests',
        element: <ComponentGroupIntegrationTestsTab />,
      },
      {
        path: 'pipelineruns',
        element: <ComponentGroupPipelineRunsTab />,
      },
      {
        path: 'snapshots',
        loader: snapshotsTabLoader,
        element: <ComponentGroupSnapshotsTab />,
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
