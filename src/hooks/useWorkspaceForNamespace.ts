import * as React from 'react';
import { useWorkspaceInfo } from '../components/Workspace/useWorkspaceInfo';
import { Workspace } from '../types';

export const useWorkspaceForNamespace = (namespace: string): Workspace => {
  const { workspaces } = useWorkspaceInfo();

  return React.useMemo(() => {
    if (!namespace) {
      return undefined;
    }

    return workspaces.find((w) => w.status?.namespaces?.some((ns) => ns.name === namespace));
  }, [namespace, workspaces]);
};
