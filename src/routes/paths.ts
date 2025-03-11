import { buildRoute, type RouteDefinition, RouterParams } from './utils';

type NamespacePath = 'workspaces';

/* Namespace/Workspace Paths */
export const NAMESPACE_LIST_PATH: RouteDefinition<NamespacePath> = buildRoute('workspaces');

export const WORKSPACE_PATH = NAMESPACE_LIST_PATH.extend(`:${RouterParams.workspaceName}`);

export const IMPORT_PATH = WORKSPACE_PATH.extend('import');

export const APPLICATION_LIST_PATH = WORKSPACE_PATH.extend(`applications`);

export const SECRET_LIST_PATH = WORKSPACE_PATH.extend(`secrets`);

export const SECRET_CREATE_PATH = SECRET_LIST_PATH.extend('create');

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

export const APPLICATION_RELEASE_LIST_PATH = APPLICATION_DETAILS_PATH.extend(`releases`);

export const APPLICATION_RELEASE_DETAILS_PATH = APPLICATION_RELEASE_LIST_PATH.extend(
  `:${RouterParams.releaseName}`,
);

export const RELEASE_SERVICE_PATH = WORKSPACE_PATH.extend(`release`);

export const RELEASEPLAN_PATH = RELEASE_SERVICE_PATH.extend(`release-plan`);

export const RELEASEPLANADMISSION_LIST_PATH = RELEASE_SERVICE_PATH.extend(`release-plan-admission`);

export const RELEASEPLAN_TRIGGER_PATH = RELEASEPLAN_PATH.extend(
  `trigger/:${RouterParams.releasePlanName}`,
);

export const RELEASEPLAN_EDIT_PATH = RELEASEPLAN_PATH.extend(
  `edit/:${RouterParams.releasePlanName}`,
);

export const RELEASEPLAN_CREATE_PATH = RELEASEPLAN_PATH.extend(`create`);

export const USER_ACCESS_LIST_PAGE = WORKSPACE_PATH.extend('access');
// Integration test paths

export const INTEGRATION_TEST_LIST_PATH = APPLICATION_DETAILS_PATH.extend('integrationtests');

export const INTEGRATION_TEST_DETAILS_PATH = INTEGRATION_TEST_LIST_PATH.extend(
  `:${RouterParams.integrationTestName}`,
);

export const INTEGRATION_TEST_ADD_PATH = INTEGRATION_TEST_LIST_PATH.extend('add');

export const INTEGRATION_TEST_EDIT_PATH = INTEGRATION_TEST_DETAILS_PATH.extend('edit');

// Pipeline paths

export const ACTIVITY_PATH = APPLICATION_DETAILS_PATH.extend('activity');

export const ACTIVITY_PATH_LATEST_COMMIT = ACTIVITY_PATH.extend('latest-commit');

export const PIPELINE_RUNS_LIST_PATH = ACTIVITY_PATH.extend('pipelineruns');

export const PLR_LIST_PATH = APPLICATION_DETAILS_PATH.extend('pipelineruns');

export const PIPELINE_RUNS_DETAILS_PATH = PLR_LIST_PATH.extend(`:${RouterParams.pipelineRunName}`);

export const PIPELINE_RUNS_LOG_PATH = PIPELINE_RUNS_DETAILS_PATH.extend('logs');

// Snapshot paths

export const SNAPSHOT_DETAILS_PATH = APPLICATION_DETAILS_PATH.extend(
  `snapshots/:${RouterParams.snapshotName}`,
);

export const SNAPSHOT_DETAILS_PIPELINE_RUN_PATH = SNAPSHOT_DETAILS_PATH.extend('pipelineruns');
