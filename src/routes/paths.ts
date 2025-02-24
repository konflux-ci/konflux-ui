import { buildRoute, type RouteDefinition, RouterParams } from './utils';

type WorkspacePath = `workspaces/:${typeof RouterParams.workspaceName}`;

export const WORKSPACE_PATH: RouteDefinition<WorkspacePath> = buildRoute(
  `workspaces/:${RouterParams.workspaceName}`,
);

export const IMPORT_PATH = WORKSPACE_PATH.extend('import');

export const APPLICATION_LIST_PATH = WORKSPACE_PATH.extend(`applications`);

export const APPLICATION_DETAILS_PATH = APPLICATION_LIST_PATH.extend(
  `:${RouterParams.applicationName}`,
);

export const COMPONENT_LIST_PATH = APPLICATION_DETAILS_PATH.extend('components');

export const COMPONENT_DETAILS_PATH = COMPONENT_LIST_PATH.extend(`:${RouterParams.componentName}`);

export const COMPONENT_ACTIVITY_PATH = COMPONENT_DETAILS_PATH.extend('activity');

export const COMPONENT_ACTIVITY_CHILD_TAB_PATH = COMPONENT_ACTIVITY_PATH.extend(
  `:${RouterParams.activityTab}`,
);

export const COMMIT_LIST_PATH = APPLICATION_DETAILS_PATH.extend('commit');

export const COMMIT_DETAILS_PATH = COMMIT_LIST_PATH.extend(`:${RouterParams.commitName}`);

// Integration test paths

export const INTEGRATION_TEST_LIST_PATH = APPLICATION_DETAILS_PATH.extend('integrationtests');

export const INTEGRATION_TEST_DETAILS_PATH = INTEGRATION_TEST_LIST_PATH.extend(
  `:${RouterParams.integrationTestName}`,
);

export const INTEGRATION_TEST_ADD_PATH = INTEGRATION_TEST_LIST_PATH.extend('add');

export const INTEGRATION_TEST_EDIT_PATH = INTEGRATION_TEST_DETAILS_PATH.extend('edit');

// Pipeline paths

export const PIPELINE_RUNS_LIST_PATH = APPLICATION_DETAILS_PATH.extend('pipelineruns');

export const PIPELINE_RUNS_DETAILS_PATH = PIPELINE_RUNS_LIST_PATH.extend(
  `:${RouterParams.pipelineRunName}`,
);

export const PIPELINE_RUNS_LOG_PATH = PIPELINE_RUNS_DETAILS_PATH.extend('logs');
