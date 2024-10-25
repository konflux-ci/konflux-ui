import * as React from 'react';
import { useWorkspaceInfo } from '../components/Workspace/useWorkspaceInfo';
import { getWorkspaceForNamespace } from '../components/Workspace/utils';
import { Workspace } from '../types';

export const useWorkspaceForNamespace = (namespace: string): Workspace => {
  const { workspaces } = useWorkspaceInfo();

  return React.useMemo(() => {
    if (!namespace) {
      return undefined;
    }

    return getWorkspaceForNamespace(workspaces, namespace);
  }, [namespace, workspaces]);
};
