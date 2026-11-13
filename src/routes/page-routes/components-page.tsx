import { LoaderFunction } from 'react-router-dom';
import { RouteErrorBoundry } from '@routes/RouteErrorBoundary';
import { RouterParams } from '@routes/utils';
import {
  linkedSecretsListViewLoader,
  LinkedSecretsListView,
} from '~/components/Components/LinkedSecretsListView';
import { ComponentDependencyTab } from '~/components/ComponentsPage/tabs/ComponentDependencyTab';
import { ComponentVersionsTab } from '~/components/ComponentsPage/tabs/ComponentVersionsTab';
import { ensureFeatureFlagOnLoader } from '~/feature-flags/utils';
import { ActivityTabV2 } from '~/shared/components/activity-tab/ActivityTabV2';
import {
  ComponentDetailsTab,
  ComponentDetailsViewLayout,
  componentDetailsViewLoader,
} from '../../components/ComponentsPage/ComponentDetails';
import {
  COMPONENT_DETAILS_V2_PATH,
  COMPONENT_LINKED_SECRETS_V2_PATH,
  COMPONENTS_PATH,
} from '../paths';

const linkedSecretsV2ViewLoader: LoaderFunction = (args) => {
  ensureFeatureFlagOnLoader('component-model');
  return linkedSecretsListViewLoader(args);
};

const componentsPageRoutes = [
  {
    path: COMPONENTS_PATH.path,
    errorElement: <RouteErrorBoundry />,
    async lazy() {
      ensureFeatureFlagOnLoader('component-model');
      const { default: Component } = await import(
        '~/components/ComponentList/ComponentsListView' /* webpackChunkName: "components-list" */
      );
      return { Component };
    },
  },
  {
    path: COMPONENT_DETAILS_V2_PATH.path,
    errorElement: <RouteErrorBoundry />,
    loader: componentDetailsViewLoader,
    element: <ComponentDetailsViewLayout />,
    children: [
      {
        index: true,
        element: <ComponentDetailsTab />,
      },
      {
        path: `activity/:${RouterParams.activityTab}`,
        element: <ActivityTabV2 />,
      },
      {
        path: 'activity',
        element: <ActivityTabV2 />,
      },
      {
        path: `versions`,
        element: <ComponentVersionsTab />,
      },
      {
        path: `dep-updates`,
        element: <ComponentDependencyTab />,
      },
    ],
  },
  {
    path: COMPONENT_LINKED_SECRETS_V2_PATH.path,
    element: <LinkedSecretsListView />,
    loader: linkedSecretsV2ViewLoader,
    errorElement: <RouteErrorBoundry />,
  },
];

export default componentsPageRoutes;
