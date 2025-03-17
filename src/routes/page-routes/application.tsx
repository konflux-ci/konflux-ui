import { FilterContextProvider } from '~/components/Filter/generic/FilterContext';
import { applicationPageLoader, ApplicationListView } from '../../components/Applications';
import { APPLICATION_LIST_PATH } from '../paths';
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
];

export default applicationRoutes;
