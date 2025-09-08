import { RouterParams } from '@routes/utils';
import { ActivityTab } from '~/components/Activity';
import { ApplicationDetails, ApplicationOverviewTab } from '~/components/ApplicationDetails';
import { applicationPageLoader, ApplicationListView } from '~/components/Applications';
import { ComponentListTab, componentsTabLoader } from '~/components/Components/ComponentsListView';
import { FilterContextProvider } from '~/components/Filter/generic/FilterContext';
import {
  integrationListPageLoader,
  IntegrationTestsListView,
} from '~/components/IntegrationTests/IntegrationTestsListView';
import { ReleaseListViewTab, releaseListViewTabLoader } from '~/components/Releases';
import {
  SnapshotsListViewTab,
  snapshotsTabLoader,
} from '~/components/Snapshots/SnapshotsListView/SnapshotsTab';
import { APPLICATION_DETAILS_PATH, APPLICATION_LIST_PATH } from '../paths';
import { RouteErrorBoundry } from '../RouteErrorBoundary';

const applicationRoutes = [
  {
    path: APPLICATION_LIST_PATH.path,
    loader: applicationPageLoader,
    element: (
      <FilterContextProvider filterParams={['name']}>
        <ApplicationListView />
      </FilterContextProvider>
    ),
    errorElement: <RouteErrorBoundry />,
  },
  {
    path: APPLICATION_DETAILS_PATH.path,
    element: <ApplicationDetails />,
    errorElement: <RouteErrorBoundry />,
    children: [
      {
        index: true,
        element: <ApplicationOverviewTab />,
      },
      {
        path: `activity/:${RouterParams.activityTab}`,
        element: <ActivityTab />,
      },
      {
        path: `activity`,
        element: <ActivityTab />,
      },
      {
        path: 'components',
        loader: componentsTabLoader,
        errorElement: <RouteErrorBoundry />,
        element: <ComponentListTab />,
      },
      {
        path: 'integrationtests',
        loader: integrationListPageLoader,
        errorElement: <RouteErrorBoundry />,
        element: (
          <FilterContextProvider filterParams={['name']}>
            <IntegrationTestsListView />
          </FilterContextProvider>
        ),
      },
      {
        path: 'snapshots',
        loader: snapshotsTabLoader,
        errorElement: <RouteErrorBoundry />,
        element: <SnapshotsListViewTab />,
      },
      {
        path: 'releases',
        loader: releaseListViewTabLoader,
        errorElement: <RouteErrorBoundry />,
        element: (
          <FilterContextProvider filterParams={['name', 'release plan', 'release snapshot']}>
            <ReleaseListViewTab />
          </FilterContextProvider>
        ),
      },
    ],
  },
];

export default applicationRoutes;
