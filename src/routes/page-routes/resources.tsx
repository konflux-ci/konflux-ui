import { RESOURCES_PATH } from '../paths';
import { RouteErrorBoundry } from '../RouteErrorBoundary';

const resourcesRoutes = [
  {
    path: RESOURCES_PATH.path,
    lazy: async () => {
      const { default: Component } = await import('~/components/Resources');
      return { Component };
    },
    errorElement: <RouteErrorBoundry />,
  },
];

export default resourcesRoutes;
