import { PipelineRunsFilterContextProvider } from '~/components/Filter/utils/PipelineRunsFilterContext';
import {
  CommitDetailsView,
  CommitOverviewTab,
  CommitsPipelineRunTab,
} from '../../components/Commits/CommitDetails';
import { COMMIT_DETAILS_PATH } from '../paths';
import { RouteErrorBoundry } from '../RouteErrorBoundary';

const commitRoutes = [
  /* Commit list view */
  {
    path: COMMIT_DETAILS_PATH.path,
    errorElement: <RouteErrorBoundry />,
    element: <CommitDetailsView />,
    children: [
      { index: true, element: <CommitOverviewTab /> },
      {
        path: 'pipelineruns',
        element: (
          <PipelineRunsFilterContextProvider>
            <CommitsPipelineRunTab />
          </PipelineRunsFilterContextProvider>
        ),
      },
    ],
  },
];

export default commitRoutes;
