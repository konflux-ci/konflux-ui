import { redirect } from 'react-router-dom';
import { ActivityTab } from '../../components/Activity';
import { ApplicationDetails, ApplicationOverviewTab } from '../../components/ApplicationDetails';
import { applicationPageLoader, ApplicationListView } from '../../components/Applications';
import {
  ComponentListTab,
  componentsTabLoader,
} from '../../components/Components/ComponentsListView';
import { FilterContextProvider } from '../../components/Filter/generic/FilterContext';
import { IntegrationTestsTab } from '../../components/IntegrationTests/IntegrationTestsTab';
import { ReleaseListViewTab, releaseListViewTabLoader } from '../../components/Releases';
import {
  APPLICATION_DETAILS_PATH,
  APPLICATION_LIST_PATH,
  INTEGRATION_TEST_LIST_PATH,
} from '../paths';
import { RouteErrorBoundry } from '../RouteErrorBoundary';
import { RouterParams } from '../utils';

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
        path: 'integrationtests/tabs/:integrationTestTab',
        errorElement: <RouteErrorBoundry />,
        element: <IntegrationTestsTab />,
      },
      {
        path: 'integrationtests',
        loader: ({ params }) => {
          // Redirect to the list tab by default, using the correct nested path
          return redirect(
            `${INTEGRATION_TEST_LIST_PATH.createPath({
              workspaceName: params[RouterParams.workspaceName],
              applicationName: params[RouterParams.applicationName],
            })}/tabs/list`,
          );
        },
        errorElement: <RouteErrorBoundry />,
        element: <IntegrationTestsTab />,
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
