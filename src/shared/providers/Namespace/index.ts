import { LoaderFunction } from 'react-router-dom';
import { queryNamespaces } from './utils';

export const namespaceLoader: LoaderFunction = async () => {
  const workspaces = await queryNamespaces();
  return { data: workspaces };
};

export { NamespaceProvider } from './namespace-context';
export * from './useNamespaceInfo';
