import { queryOptions as _createQueryOptions, UseQueryOptions } from '@tanstack/react-query';
import { K8sGetResource, K8sListResourceItems, queryClient } from '../../../k8s';
import { NamespaceModel } from '../../../models';
import { NamespaceKind } from '../../../types';

const LOCAL_STORAGE_NAMESPACE_KEY = 'lastUsedNamespace';

export const NAMESPACE_QUERY_KEY = 'namespace';

export const getLastUsedNamespace = (): string => {
  return localStorage.getItem(LOCAL_STORAGE_NAMESPACE_KEY);
};

export const setLastUsedNamespace = (workspace: string) => {
  localStorage.setItem(LOCAL_STORAGE_NAMESPACE_KEY, workspace);
};

const createNamespaceQueryKey = (name?: string) => {
  return [NAMESPACE_QUERY_KEY, ...(name ? [name] : [])];
};

function fetchNamespaces(): Promise<NamespaceKind[]>;
function fetchNamespaces(name: string): Promise<NamespaceKind>;
function fetchNamespaces(name?: string): Promise<NamespaceKind | NamespaceKind[]> {
  return !name
    ? K8sListResourceItems<NamespaceKind>({ model: NamespaceModel })
    : K8sGetResource<NamespaceKind>({ model: NamespaceModel, queryOptions: { name } });
}

export function createNamespaceQueryOptions(): UseQueryOptions<NamespaceKind[]>;
export function createNamespaceQueryOptions(name: string): UseQueryOptions<NamespaceKind>;
export function createNamespaceQueryOptions(
  name?: string,
): UseQueryOptions<NamespaceKind | NamespaceKind[]> {
  return _createQueryOptions({
    queryKey: createNamespaceQueryKey(name),
    queryFn: () => fetchNamespaces(name),
    initialData: name
      ? () => {
          return queryClient
            .getQueryData<NamespaceKind[]>([NAMESPACE_QUERY_KEY])
            ?.find((w: NamespaceKind) => w.metadata.name === name);
        }
      : undefined,
    staleTime: name ? 5_00_000 : Infinity,
  });
}

export function invalidateNamespaceQuery(): Promise<void>;
export function invalidateNamespaceQuery(name: string): Promise<void>;
export async function invalidateNamespaceQuery(name?: string): Promise<void> {
  return await queryClient.invalidateQueries({ queryKey: createNamespaceQueryKey(name) });
}

export const queryNamespaces = () => {
  return queryClient.ensureQueryData(createNamespaceQueryOptions());
};
