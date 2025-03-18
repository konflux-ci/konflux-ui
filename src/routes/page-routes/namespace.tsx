import { FilterContextProvider } from '~/components/Filter/generic/FilterContext';
import { importPageLoader, ImportForm } from '../../components/ImportForm';
import { IMPORT_PATH, NAMESPACE_LIST_PATH } from '../paths';
import { RouteErrorBoundry } from '../RouteErrorBoundary';

const workspaceRoutes = [
  {
    path: NAMESPACE_LIST_PATH.path,
    errorElement: <RouteErrorBoundry />,
    async lazy() {
      const { NamespaceListView } = await import('../../components/NamespaceList');
      return {
        element: (
          <FilterContextProvider filterParams={['name']}>
            <NamespaceListView />{' '}
          </FilterContextProvider>
        ),
      };
    },
  },
  {
    path: IMPORT_PATH.path,
    loader: importPageLoader,
    errorElement: <RouteErrorBoundry />,
    element: <ImportForm />,
  },
];

export default workspaceRoutes;
