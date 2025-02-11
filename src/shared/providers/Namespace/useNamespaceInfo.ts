import { useContext } from 'react';
import { useQuery } from '@tanstack/react-query';
import { NamespaceContext } from './namespace-context';
import { createNamespaceQueryOptions } from './utils';

export const useNamespaceInfo = () => useContext(NamespaceContext);

export const useNamespace = () => useNamespaceInfo().namespace;

export const useNamespacesQuery = () => useQuery(createNamespaceQueryOptions());
