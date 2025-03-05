import {
  CommitDetailsView,
  CommitOverviewTab,
  CommitsPipelineRunTab,
} from '../../components/Commits/CommitDetails';
import { RouteErrorBoundry } from '../RouteErrorBoundary';
import { RouterParams } from '../utils';

const commitRoutes = [
  /* Commit list view */
  {
    path: `workspaces/:${RouterParams.workspaceName}/applications/:${RouterParams.applicationName}/commit/:${RouterParams.commitName}`,
    errorElement: <RouteErrorBoundry />,
    element: <CommitDetailsView />,
    children: [
      { index: true, element: <CommitOverviewTab /> },
      { path: 'pipelineruns', element: <CommitsPipelineRunTab /> },
    ],
  },
];

export default commitRoutes;
