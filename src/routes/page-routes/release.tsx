import { FilterContextProvider } from '~/components/Filter/generic/FilterContext';
import {
  ReleaseDetailsLayout,
  releaseListViewTabLoader,
  ReleaseOverviewTab,
  ReleasePipelineRunTab,
} from '../../components/Releases';
import ReleaseArtifactsTab from '../../components/Releases/ReleaseArtifactsTab';
import { APPLICATION_RELEASE_DETAILS_PATH } from '../paths';
import { RouteErrorBoundry } from '../RouteErrorBoundary';

const releaseRoutes = [
  // details page
  {
    path: APPLICATION_RELEASE_DETAILS_PATH.path,
    loader: releaseListViewTabLoader,
    errorElement: <RouteErrorBoundry />,
    element: <ReleaseDetailsLayout />,
    children: [
      {
        index: true,
        element: <ReleaseOverviewTab />,
      },
      {
        path: 'pipelineruns',
        element: (
          <FilterContextProvider filterParams={['name']}>
            <ReleasePipelineRunTab />
          </FilterContextProvider>
        ),
      },
      {
        path: 'artifacts',
        element: <ReleaseArtifactsTab />,
      },
    ],
  },
];

export default releaseRoutes;
