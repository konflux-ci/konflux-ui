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
