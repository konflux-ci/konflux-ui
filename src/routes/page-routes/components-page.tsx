import { RouteErrorBoundry } from '@routes/RouteErrorBoundary';
import { COMPONENTS_PATH } from '../paths';

const componentsPageRoutes = [
  {
    path: COMPONENTS_PATH.path,
    lazy: async () => {
      const { default: Component } = await import('~/components/ComponentsPage/ComponentsPage');
      return { Component };
    },
    errorElement: <RouteErrorBoundry />,
  },
];

export default componentsPageRoutes;
