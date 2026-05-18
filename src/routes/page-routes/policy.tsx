import { ensureFeatureFlagOnLoader } from '~/feature-flags/utils';
import { POLICY_PATH } from '../paths';
import { RouteErrorBoundry } from '../RouteErrorBoundary';

const policyRoutes = [
  {
    path: POLICY_PATH.path,
    lazy: async () => {
      ensureFeatureFlagOnLoader('conforma-policy');
      const { default: Component } = await import(
        '~/components/Policy/PolicyPage' /* webpackChunkName: "policy" */
      );
      return { Component };
    },
    errorElement: <RouteErrorBoundry />,
  },
];

export default policyRoutes;
