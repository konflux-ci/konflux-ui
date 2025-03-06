import {
  CommitDetailsView,
  CommitOverviewTab,
  CommitsPipelineRunTab,
} from '../../components/Commits/CommitDetails';
import { COMMIT_DETAILS_PATH } from '../paths';
import { RouteErrorBoundry } from '../RouteErrorBoundary';
import { RouterParams } from '../utils';

const commitRoutes = [
  /* Commit list view */
  {
    path: COMMIT_DETAILS_PATH.createPath({
      workspaceName: `:${RouterParams.workspaceName}`,
      applicationName: `:${RouterParams.applicationName}`,
      commitName: `:${RouterParams.commitName}`,
    }),
    errorElement: <RouteErrorBoundry />,
    element: <CommitDetailsView />,
    children: [
      { index: true, element: <CommitOverviewTab /> },
      { path: 'pipelineruns', element: <CommitsPipelineRunTab /> },
    ],
  },
];

export default commitRoutes;
