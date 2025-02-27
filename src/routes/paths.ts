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
