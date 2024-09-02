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
  /**
   * This is used to trigger a manual re-fetch of the Workspace CR when there
   * are status updates to the space lister API. Needed because we cannot use
   * k8s utils to get/watch the resource since k8s utils add workspace context
   * in url and the workspace API does not like it.
   */
  updateWorkspace: () => void;
};

const WorkspaceContext = React.createContext<WorkspaceContextData>({
  namespace: '',
  workspace: '',
  workspaceResource: undefined,
  workspacesLoaded: false,
  lastUsedWorkspace: getLastUsedWorkspace(),
  updateWorkspace: () => {},
});

export const useWorkspaceInfo = () => React.useContext(WorkspaceContext);

export const WorkspaceProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const { data: workspaces, isLoading: workspaceLoading } = useQuery(createWorkspaceQueryOptions());
  const params = useParams<RouterParams>();

  const activeWorkspaceName =
    params.workspaceName ?? getLastUsedWorkspace() ?? getHomeWorkspace(workspaces)?.metadata?.name;

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
        workspacesLoaded: !(workspaceLoading && activeWorkspaceLoading),
        lastUsedWorkspace: getLastUsedWorkspace(),
        updateWorkspace: () => {},
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
