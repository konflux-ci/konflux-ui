import * as React from 'react';
import { useParams } from 'react-router-dom';
import { Bullseye, Spinner } from '@patternfly/react-core';
import { useQuery } from '@tanstack/react-query';
import { RouterParams } from '../../routes/utils';
import { Workspace } from '../../types';
import {
  createWorkspaceQueryOptions,
  getDefaultNsForWorkspace,
  getHomeWorkspace,
  getLastUsedWorkspace,
  setLastUsedWorkspace,
} from './utils';

export type WorkspaceContextData = {
  namespace: string;
  workspace: string;
  workspaceResource: Workspace | undefined;
  workspacesLoaded: boolean;
  lastUsedWorkspace: string;
  workspaces: Workspace[];
};

export const WorkspaceContext = React.createContext<WorkspaceContextData>({
  namespace: '',
  workspace: '',
  workspaceResource: undefined,
  workspacesLoaded: false,
  workspaces: [],
  lastUsedWorkspace: getLastUsedWorkspace(),
});

export const WorkspaceProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const { data: workspaces, isLoading: workspaceLoading } = useQuery(createWorkspaceQueryOptions());
  const params = useParams<RouterParams>();

  const activeWorkspaceName =
    params.workspaceName ??
    getLastUsedWorkspace() ??
    getHomeWorkspace(workspaces)?.metadata?.name ??
    workspaces[0]?.metadata?.name;

  const { data: workspaceResource, isLoading: activeWorkspaceLoading } = useQuery(
    createWorkspaceQueryOptions(activeWorkspaceName),
  );

  const namespace = !activeWorkspaceLoading
    ? getDefaultNsForWorkspace(workspaceResource)?.name
    : undefined;

  React.useEffect(() => {
    if (getLastUsedWorkspace() !== activeWorkspaceName) {
      setLastUsedWorkspace(activeWorkspaceName);
    }
  }, [activeWorkspaceName]);

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
      {!(workspaceLoading && activeWorkspaceLoading) ? (
        children
      ) : (
        <Bullseye>
          <Spinner />
        </Bullseye>
      )}
    </WorkspaceContext.Provider>
  );
};
