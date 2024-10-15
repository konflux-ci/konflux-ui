import { useContext } from 'react';
import { WorkspaceContext } from './workspace-context';

export const useWorkspaceInfo = () => useContext(WorkspaceContext);
