import { RouteErrorBoundry } from '@routes/RouteErrorBoundary';
import {
  ComponentActivityTab,
  ComponentDetailsTab,
  ComponentDetailsViewLayout,
  componentDetailsViewLoader,
  ComponentVersionsTab,
} from '../../components/ComponentsPage/ComponentDetails';
import {
  ComponentVersionActivityTab,
  ComponentVersionDetailsViewLayout,
  componentVersionDetailsViewLoader,
  ComponentVersionOverviewTab,
} from '../../components/ComponentsPage/ComponentVersionDetails';
import { COMPONENT_DETAILS_V2_PATH, COMPONENTS_PATH } from '../paths';
import { RouterParams } from '../utils';

const componentsPageRoutes = [
  {
    path: COMPONENTS_PATH.path,
    lazy: async () => {
      const { default: Component } = await import('~/components/ComponentsPage/ComponentsPage');
      return { Component };
    },
    errorElement: <RouteErrorBoundry />,
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
        element: <ComponentActivityTab />,
      },
      {
        path: 'activity',
        element: <ComponentActivityTab />,
      },
      {
        path: 'versions',
        element: <ComponentVersionsTab />,
      },
      {
        path: `vers/:${RouterParams.verName}`,
        errorElement: <RouteErrorBoundry />,
        loader: componentVersionDetailsViewLoader,
        element: <ComponentVersionDetailsViewLayout />,
        children: [
          {
            index: true,
            element: <ComponentVersionOverviewTab />,
          },
          {
            path: 'activity',
            element: <ComponentVersionActivityTab />,
          },
          {
            path: `activity/:${RouterParams.activityTab}`,
            element: <ComponentVersionActivityTab />,
          },
        ],
      },
    ],
  },
];

export default componentsPageRoutes;
