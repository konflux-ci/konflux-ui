import { LoaderFunction } from 'react-router-dom';
import { queryWorkspaces } from './utils';

/**
 * @deprecated in favor of Namespaces
 */
export const workspaceLoader: LoaderFunction = async () => {
  const workspaces = await queryWorkspaces();
  return { data: workspaces };
};

/**
 * @deprecated in favor of Namespaces
 */
export { WorkspaceProvider } from './workspace-context';
