import { LoaderFunction } from 'react-router-dom';
import { queryWorkspaces } from './utils';

export const workspaceLoader: LoaderFunction = async () => {
  const workspaces = await queryWorkspaces();
  return { data: workspaces };
};

export { WorkspaceProvider } from './workspace-context';
