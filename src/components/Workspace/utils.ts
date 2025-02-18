import { queryOptions as _createQueryOptions, UseQueryOptions } from '@tanstack/react-query';
import { K8sGetResource, K8sListResourceItems } from '../../k8s/k8s-fetch';
import { queryClient } from '../../k8s/query/core';
import { WorkspaceModel } from '../../models';
import { Workspace } from '../../types';

/**
 * @deprecated in favor of [Namespace](../../shared/providers/Namespace/utils.ts)
 */
const LOCAL_STORAGE_WORKSPACE_KEY = 'lastUsedWorkspace';

/**
 * @deprecated in favor of [Namespace](../../shared/providers/Namespace/utils.ts)
 */
export const WORKSPACE_QUERY_KEY = 'workspaces';

/**
 * @deprecated in favor of [Namespace](../../shared/providers/Namespace/utils.ts)
 */
export const getLastUsedWorkspace = (): string => {
  return localStorage.getItem(LOCAL_STORAGE_WORKSPACE_KEY);
};

/**
 * @deprecated in favor of [Namespace](../../shared/providers/Namespace/utils.ts)
 */
export const setLastUsedWorkspace = (workspace: string) => {
  localStorage.setItem(LOCAL_STORAGE_WORKSPACE_KEY, workspace);
};

/**
 * @deprecated in favor of [Namespace](../../shared/providers/Namespace/utils.ts)
 */
const createWorkspaceQueryKey = (name?: string) => {
  return [WORKSPACE_QUERY_KEY, ...(name ? [name] : [])];
};

/**
 * @deprecated in favor of [Namespace](../../shared/providers/Namespace/utils.ts)
 */
export const getHomeWorkspace = (workspaces: Workspace[]) =>
  workspaces?.find((w) => w?.status?.type === 'home');

/**
 * @deprecated in favor of [Namespace](../../shared/providers/Namespace/utils.ts)
 */
export const getDefaultNsForWorkspace = (obj: Workspace) => {
  return obj?.status?.namespaces.find((n) => n.type === 'default');
};

/**
 * @deprecated in favor of [Namespace](../../shared/providers/Namespace/utils.ts)
 */
export const getWorkspaceForNamespace = (workspaces: Workspace[], namespace) => {
  return workspaces?.find((w) => w.status?.namespaces?.some((ns) => ns.name === namespace));
};

/**
 * @deprecated in favor of [Namespace](../../shared/providers/Namespace/utils.ts)
 */
function fetchWorkspaces(): Promise<Workspace[]>;
function fetchWorkspaces(name: string): Promise<Workspace>;
function fetchWorkspaces(name?: string): Promise<Workspace | Workspace[]> {
  return !name
    ? K8sListResourceItems<Workspace>({ model: WorkspaceModel })
    : K8sGetResource<Workspace>({ model: WorkspaceModel, queryOptions: { name } });
}

/**
 * @deprecated in favor of [Namespace](../../shared/providers/Namespace/utils.ts)
 */
export function createWorkspaceQueryOptions(): UseQueryOptions<Workspace[]>;
export function createWorkspaceQueryOptions(name: string): UseQueryOptions<Workspace>;
export function createWorkspaceQueryOptions(
  name?: string,
): UseQueryOptions<Workspace | Workspace[]> {
  return _createQueryOptions({
    queryKey: createWorkspaceQueryKey(name),
    queryFn: () => fetchWorkspaces(name),
    initialData: name
      ? () => {
          return queryClient
            .getQueryData<Workspace[]>([WORKSPACE_QUERY_KEY])
            ?.find((w: Workspace) => w.metadata.name === name);
        }
      : undefined,
    staleTime: name ? 5_00_000 : Infinity,
  });
}

/**
 * @deprecated in favor of [Namespace](../../shared/providers/Namespace/utils.ts)
 */
export function invalidateWorkspaceQuery(): Promise<void>;
export function invalidateWorkspaceQuery(name: string): Promise<void>;
export async function invalidateWorkspaceQuery(name?: string): Promise<void> {
  return await queryClient.invalidateQueries({ queryKey: createWorkspaceQueryKey(name) });
}

/**
 * @deprecated in favor of [Namespace](../../shared/providers/Namespace/utils.ts)
 */
export const getNamespaceUsingWorspaceFromQueryCache = async (
  workspace: string,
): Promise<string | undefined> => {
  return getDefaultNsForWorkspace(
    await queryClient.ensureQueryData({
      ...createWorkspaceQueryOptions(workspace),
      revalidateIfStale: true,
    }),
  )?.name;
};

/**
 * @deprecated in favor of [Namespace](../../shared/providers/Namespace/utils.ts)
 */
export const getWorkspaceUsingNamespaceFromQueryCache = async (
  namespace: string,
): Promise<string | undefined> => {
  return getWorkspaceForNamespace(
    await queryClient.ensureQueryData({
      ...createWorkspaceQueryOptions(),
      revalidateIfStale: true,
    }),
    namespace,
  )?.metadata?.name;
};

/**
 * @deprecated in favor of [Namespace](../../shared/providers/Namespace/utils.ts)
 */
export const queryWorkspaces = () => {
  return queryClient.ensureQueryData(createWorkspaceQueryOptions());
};
