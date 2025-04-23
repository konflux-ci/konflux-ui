import {
  ReleaseDetailsLayout,
  releaseListViewTabLoader,
  ReleaseOverviewTab,
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
        path: 'artifacts',
        element: <ReleaseArtifactsTab />,
      },
      {
        path: 'yaml',
        async lazy() {
          const { ReleaseYamlTab } = await import('../../components/Releases/ReleaseYamlTab');
          return { element: <ReleaseYamlTab /> };
        },
      },
    ],
  },
];

export default releaseRoutes;
