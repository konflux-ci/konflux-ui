import { RouteErrorBoundry } from '@routes/RouteErrorBoundary';
import { ensureFeatureFlagOnLoader } from '~/feature-flags/utils';
import { ComponentVersionsTab } from '~/components/ComponentsPage/tabs/ComponentVersionsTab';
import {
  ComponentDetailsTab,
  ComponentDetailsViewLayout,
  componentDetailsViewLoader,
} from '../../components/ComponentsPage/ComponentDetails';
import { COMPONENT_DETAILS_V2_PATH, COMPONENTS_PATH } from '../paths';

const componentsPageRoutes = [
  {
    path: COMPONENTS_PATH.path,
    errorElement: <RouteErrorBoundry />,
    async lazy() {
      ensureFeatureFlagOnLoader('components-page');
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
        path: 'activity',
        element: null, // TODO: implement Activity tab https://issues.redhat.com/browse/KFLUXUI-1006
      },
      {
        path: `versions`,
        element: <ComponentVersionsTab />,
      },
    ],
  },
];

export default componentsPageRoutes;
