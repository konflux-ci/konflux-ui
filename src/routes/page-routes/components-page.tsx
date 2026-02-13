import { RouteErrorBoundry } from '@routes/RouteErrorBoundary';
import {
  ComponentActivityTab,
  ComponentDetailsTab,
  ComponentDetailsViewLayout,
  componentDetailsViewLoader,
} from '../../components/ComponentsPage/ComponentDetails';
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
        path: `versions`,
        element: null, // TODO: implement Versions tab https://issues.redhat.com/browse/KFLUXUI-1007
      },
    ],
  },
];

export default componentsPageRoutes;
