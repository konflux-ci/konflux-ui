import { MINTMAKER_SCHEDULE_PATH } from '@routes/paths';
import { RouteErrorBoundry } from '@routes/RouteErrorBoundary';
import { ensureFeatureFlagOnLoader } from '~/feature-flags/utils';

const mintMakerScheduleRoutes = [
  {
    path: MINTMAKER_SCHEDULE_PATH.path,
    errorElement: <RouteErrorBoundry />,
    async lazy() {
      ensureFeatureFlagOnLoader('mintmaker');
      const { MintMakerSchedulePage: Component } = await import(
        '~/components/MintMakerSchedule/MintMakerSchedulePage' /* webpackChunkName: "mintmaker-schedule" */
      );

      return { Component };
    },
  },
];

export default mintMakerScheduleRoutes;
