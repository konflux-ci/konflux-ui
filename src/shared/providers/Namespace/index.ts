import { LoaderFunction } from 'react-router-dom';
import { queryNamespaces } from './utils';

export const namespaceLoader: LoaderFunction = async () => {
  const namespaces = await queryNamespaces();
  return { data: namespaces };
};

export { NamespaceProvider } from './namespace-context';
export * from './useNamespaceInfo';
