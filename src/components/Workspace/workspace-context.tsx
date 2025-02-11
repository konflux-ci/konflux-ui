import * as React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Bullseye, Button, Spinner } from '@patternfly/react-core';
import { useQuery } from '@tanstack/react-query';
import { RouterParams } from '../../routes/utils';
import ErrorEmptyState from '../../shared/components/empty-state/ErrorEmptyState';
import { Workspace } from '../../types';
import {
  createWorkspaceQueryOptions,
  getDefaultNsForWorkspace,
  getHomeWorkspace,
  getLastUsedWorkspace,
  setLastUsedWorkspace,
} from './utils';

/**
 * @deprecated in favor of [Namespace](../../shared/providers/Namespace/namespace-context.ts)
 */
export type WorkspaceContextData = {
  namespace: string;
  workspace: string;
  workspaceResource: Workspace | undefined;
  workspacesLoaded: boolean;
  lastUsedWorkspace: string;
  workspaces: Workspace[];
};

/**
 * @deprecated in favor of [Namespace](../../shared/providers/Namespace/namespace-context.ts)
 */
export const WorkspaceContext = React.createContext<WorkspaceContextData>({
  namespace: '',
  workspace: '',
  workspaceResource: undefined,
  workspacesLoaded: false,
  workspaces: [],
  lastUsedWorkspace: getLastUsedWorkspace(),
});

/**
 * @deprecated in favor of [Namespace](../../shared/providers/Namespace/namespace-context.ts)
 */
export const WorkspaceProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const { data: workspaces, isLoading: workspaceLoading } = useQuery(createWorkspaceQueryOptions());
  const params = useParams<RouterParams>();
  const navigate = useNavigate();

  const homeWorkspace = React.useMemo(
    () => (!workspaceLoading ? getHomeWorkspace(workspaces) ?? workspaces[0] : null),
    [workspaces, workspaceLoading],
  );

  const activeWorkspaceName =
    params.workspaceName ?? getLastUsedWorkspace() ?? homeWorkspace?.metadata?.name;

  const {
    data: workspaceResource,
    isLoading: activeWorkspaceLoading,
    error,
  } = useQuery({ ...createWorkspaceQueryOptions(activeWorkspaceName), retry: false });

  const namespace = !activeWorkspaceLoading
    ? getDefaultNsForWorkspace(workspaceResource)?.name
    : undefined;

  React.useEffect(() => {
    if (!error && getLastUsedWorkspace() !== activeWorkspaceName) {
      setLastUsedWorkspace(activeWorkspaceName);
    }
  }, [activeWorkspaceName, error]);

  if (error) {
    return (
      <ErrorEmptyState
        title={`Unable to access workspace ${activeWorkspaceName}`}
        body={error.message}
      >
        {homeWorkspace ? (
          <Button
            variant="primary"
            onClick={() => {
              setLastUsedWorkspace(homeWorkspace.metadata.name);
              navigate(`/workspaces/${homeWorkspace.metadata.name}/applications`);
            }}
          >
            Go to {homeWorkspace.metadata.name} workspace
          </Button>
        ) : null}
      </ErrorEmptyState>
    );
  }

  return (
    <WorkspaceContext.Provider
      value={{
        namespace,
        workspace: activeWorkspaceName,
        workspaceResource,
        workspaces,
        workspacesLoaded: !(workspaceLoading && activeWorkspaceLoading),
        lastUsedWorkspace: getLastUsedWorkspace(),
      }}
    >
      {!(workspaceLoading || activeWorkspaceLoading) ? (
        children
      ) : (
        <Bullseye>
          <Spinner />
        </Bullseye>
      )}
    </WorkspaceContext.Provider>
  );
};
