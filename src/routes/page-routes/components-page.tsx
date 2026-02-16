import { RouteErrorBoundry } from '@routes/RouteErrorBoundary';
import { IfFeature } from '~/feature-flags/hooks';
import ComponentList from '../../components/ComponentList/ComponentList';
import {
  ComponentDetailsTab,
  ComponentDetailsViewLayout,
  componentDetailsViewLoader,
} from '../../components/ComponentsPage/ComponentDetails';
import { FilterContextProvider } from '../../components/Filter/generic/FilterContext';
import { COMPONENT_DETAILS_V2_PATH, COMPONENTS_PATH } from '../paths';

const ComponentsListRoute: React.FC = () => {
  return (
    <FilterContextProvider filterParams={['name']}>
      <ComponentList />
    </FilterContextProvider>
  );
};

const componentsPageRoutes = [
  {
    path: COMPONENTS_PATH.path,
    element: (
      <IfFeature flag="components-page" fallback={null}>
        <ComponentsListRoute />
      </IfFeature>
    ),
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
        path: 'activity',
        element: null, // TODO: implement Activity tab https://issues.redhat.com/browse/KFLUXUI-1006
      },
      {
        path: `versions`,
        element: null, // TODO: implement Versions tab https://issues.redhat.com/browse/KFLUXUI-1007
      },
    ],
  },
];

export default componentsPageRoutes;
