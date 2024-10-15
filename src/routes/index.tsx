import { createBrowserRouter } from 'react-router-dom';
import { AppRoot } from '../AppRoot/AppRoot';
import { ActivityTab } from '../components/Activity';
import { ApplicationDetails, ApplicationOverviewTab } from '../components/ApplicationDetails';
import { applicationPageLoader, ApplicationListView } from '../components/Applications';
import {
  CommitDetailsView,
  CommitOverviewTab,
  CommitsPipelineRunTab,
} from '../components/Commits/CommitDetails';
import {
  ComponentActivityTab,
  ComponentDetailsTab,
  ComponentDetailsViewLayout,
  componentDetailsViewLoader,
} from '../components/Components/ComponentDetails';
import { ComponentListTab, componentsTabLoader } from '../components/Components/ComponentsListView';
import { importPageLoader, ImportForm } from '../components/ImportForm';
import {
  integrationDetailsPageLoader,
  IntegrationTestDetailsView,
  IntegrationTestOverviewTab,
  IntegrationTestPipelineRunTab,
} from '../components/IntegrationTests/IntegrationTestDetails';
import {
  IntegrationTestCreateForm,
  integrationTestCreateFormLoader,
  IntegrationTestEditForm,
  integrationTestEditFormLoader,
} from '../components/IntegrationTests/IntegrationTestForm';
import {
  integrationListPageLoader,
  IntegrationTestsListView,
} from '../components/IntegrationTests/IntegrationTestsListView';
import { ModalProvider } from '../components/modal/ModalProvider';
import { Overview } from '../components/Overview/Overview';
import {
  PipelineRunDetailsLayout,
  PipelineRunDetailsLogsTab,
  PipelineRunDetailsTab,
  pipelineRunDetailsViewLoader,
  PipelineRunSecurityEnterpriseContractTab,
  PipelineRunTaskRunsTab,
} from '../components/PipelineRun/PipelineRunDetailsView';
import {
  ReleaseDetailsLayout,
  releaseDetailsViewLoader,
  ReleaseListViewTab,
  releaseListViewTabLoader,
  ReleaseOverviewTab,
} from '../components/Releases';
import {
  TaskRunDetailsTab,
  TaskRunDetailsViewLayout,
  taskRunDetailsViewLoader,
  TaskRunLogsTab,
  TaskrunSecurityEnterpriseContractTab,
} from '../components/TaskRunDetailsView';
import { queryWorkspaces } from '../components/Workspace/utils';
import { WorkspaceProvider } from '../components/Workspace/workspace-context';
import { RouteErrorBoundry } from './RouteErrorBoundary';
import { RouterParams } from './utils';

export const router = createBrowserRouter([
  {
    path: '/',
    loader: async () => {
      const workspaces = await queryWorkspaces();
      return { data: workspaces };
    },
    element: (
      <WorkspaceProvider>
        <ModalProvider>
          <AppRoot />
        </ModalProvider>
      </WorkspaceProvider>
    ),
    children: [
      {
        index: true,
        element: <Overview />,
      },
      {
        path: `/workspaces/:${RouterParams.workspaceName}/import`,
        loader: importPageLoader,
        errorElement: <RouteErrorBoundry />,
        element: <ImportForm />,
      },
      {
        path: `/workspaces/:${RouterParams.workspaceName}/applications`,
        loader: applicationPageLoader,
        element: <ApplicationListView />,
        errorElement: <RouteErrorBoundry />,
      },
      /* Application details */
      {
        path: `/workspaces/:${RouterParams.workspaceName}/applications/:${RouterParams.applicationName}`,
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
            element: <IntegrationTestsListView />,
          },
          {
            path: 'releases',
            loader: releaseListViewTabLoader,
            errorElement: <RouteErrorBoundry />,
            element: <ReleaseListViewTab />,
          },
        ],
      },
      /* Component details route */
      {
        path: `/workspaces/:${RouterParams.workspaceName}/applications/:${RouterParams.applicationName}/components/:${RouterParams.componentName}`,
        errorElement: <RouteErrorBoundry />,
        loader: componentDetailsViewLoader,
        element: <ComponentDetailsViewLayout />,
        children: [
          {
            index: true,
            element: <ComponentDetailsTab />,
          },
          {
            path: `activity/:${RouterParams.activityTab}`,
            element: <ComponentActivityTab />,
          },
          {
            path: `activity`,
            element: <ComponentActivityTab />,
          },
        ],
      },
      /* IntegrationTestScenario routes */
      {
        // create form
        path: `/workspaces/:${RouterParams.workspaceName}/applications/:${RouterParams.applicationName}/integrationtests/add`,
        loader: integrationTestCreateFormLoader,
        errorElement: <RouteErrorBoundry />,
        element: <IntegrationTestCreateForm />,
      },
      {
        // edit form
        path: `/workspaces/:${RouterParams.workspaceName}/applications/:${RouterParams.applicationName}/integrationtests/:${RouterParams.integrationTestName}/edit`,
        loader: integrationTestEditFormLoader,
        errorElement: <RouteErrorBoundry />,
        element: <IntegrationTestEditForm />,
      },
      {
        // details page
        path: `/workspaces/:${RouterParams.workspaceName}/applications/:${RouterParams.applicationName}/integrationtests/:${RouterParams.integrationTestName}`,
        loader: integrationDetailsPageLoader,
        errorElement: <RouteErrorBoundry />,
        element: <IntegrationTestDetailsView />,
        children: [
          {
            index: true,
            element: <IntegrationTestOverviewTab />,
          },
          {
            path: 'pipelineruns',
            element: <IntegrationTestPipelineRunTab />,
          },
        ],
      },
      /* Release routes */
      {
        // details page
        path: `/workspaces/:${RouterParams.workspaceName}/applications/:${RouterParams.applicationName}/releases/:${RouterParams.releaseName}`,
        loader: releaseDetailsViewLoader,
        errorElement: <RouteErrorBoundry />,
        element: <ReleaseDetailsLayout />,
        children: [
          {
            index: true,
            element: <ReleaseOverviewTab />,
          },
        ],
      },
      /* Pipeline Run details routes */
      {
        path: `/workspaces/:${RouterParams.workspaceName}/applications/:${RouterParams.applicationName}/pipelineruns/:${RouterParams.pipelineRunName}`,
        errorElement: <RouteErrorBoundry />,
        loader: pipelineRunDetailsViewLoader,
        element: <PipelineRunDetailsLayout />,
        children: [
          { index: true, element: <PipelineRunDetailsTab /> },
          { path: 'taskruns', element: <PipelineRunTaskRunsTab /> },
          { path: 'logs', element: <PipelineRunDetailsLogsTab /> },
          { path: 'security', element: <PipelineRunSecurityEnterpriseContractTab /> },
        ],
      },
      /* Task Run details routes */
      {
        path: `/workspaces/:${RouterParams.workspaceName}/applications/:${RouterParams.applicationName}/taskruns/:${RouterParams.taskRunName}`,
        errorElement: <RouteErrorBoundry />,
        loader: taskRunDetailsViewLoader,
        element: <TaskRunDetailsViewLayout />,
        children: [
          { index: true, element: <TaskRunDetailsTab /> },
          { path: 'logs', element: <TaskRunLogsTab /> },
          { path: 'security', element: <TaskrunSecurityEnterpriseContractTab /> },
        ],
      },
      /* Commit list view */
      {
        path: `/workspaces/:${RouterParams.workspaceName}/applications/:${RouterParams.applicationName}/commit/:${RouterParams.commitName}`,
        errorElement: <RouteErrorBoundry />,
        element: <CommitDetailsView />,
        children: [
          { index: true, element: <CommitOverviewTab /> },
          { path: 'pipelineruns', element: <CommitsPipelineRunTab /> },
        ],
      },
    ],
  },
]);
