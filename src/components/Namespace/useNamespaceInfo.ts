import { useContext } from 'react';
import { NamespaceContext } from './namespace-context';

export const useNamespaceInfo = () => useContext(NamespaceContext);

export const useNamespace = () => useNamespaceInfo().namespace;
