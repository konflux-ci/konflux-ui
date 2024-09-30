import React from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useWorkspaceInfo } from '../components/Workspace/workspace-context';
import { PipelineRunKind, TaskRunKind } from '../types';
import { K8sResourceCommon } from '../types/k8s';
import {
  getPipelineRuns,
  TektonResultsOptions,
  RecordsList,
  getTaskRuns,
  getTaskRunLog,
  createPipelineRunTektonResultsQueryOptions,
  createTaskRunTektonResultsQueryOptions,
} from '../utils/tekton-results';

export type GetNextPage = () => void | undefined;

const useTRRuns = <Kind extends K8sResourceCommon>(
  getRuns: (
    workspace: string,
    namespace: string,
    options?: TektonResultsOptions,
    nextPageToken?: string,
    cacheKey?: string,
  ) => Promise<[Kind[], RecordsList, boolean?]>,
  namespace: string,
  options?: TektonResultsOptions,
  cacheKey?: string,
): [Kind[], boolean, unknown, GetNextPage] => {
  const [nextPageToken, setNextPageToken] = React.useState<string>(null);
  const [localCacheKey, setLocalCacheKey] = React.useState(cacheKey);

  if (cacheKey !== localCacheKey) {
    //force update local cache key
    setLocalCacheKey(cacheKey);
  }
  const { workspace } = useWorkspaceInfo();

  const [result, setResult] = React.useState<[Kind[], boolean, unknown, GetNextPage]>([
    [],
    false,
    undefined,
    undefined,
  ]);

  // reset token if namespace or options change
  React.useEffect(() => {
    setNextPageToken(null);
  }, [namespace, options, cacheKey]);

  React.useEffect(() => {
    let disposed = false;
    if (namespace) {
      void (async () => {
        try {
          const tkPipelineRuns = await getRuns(
            workspace,
            namespace,
            options,
            nextPageToken,
            localCacheKey,
          );
          if (!disposed) {
            const token = tkPipelineRuns[1].nextPageToken;
            const callInflight = !!tkPipelineRuns?.[2];
            const loaded = callInflight ? false : true;
            if (!callInflight) {
              setResult((cur) => [
                nextPageToken ? [...cur[0], ...tkPipelineRuns[0]] : tkPipelineRuns[0],
                loaded,
                undefined,
                token
                  ? (() => {
                      // ensure we can only call this once
                      let executed = false;
                      return () => {
                        if (!disposed && !executed) {
                          executed = true;
                          // trigger the update
                          setNextPageToken(token);
                          return true;
                        }
                        return false;
                      };
                    })()
                  : undefined,
              ]);
            }
          }
        } catch (e) {
          if (!disposed) {
            if (nextPageToken) {
              setResult((cur) => [cur[0], cur[1], e, undefined]);
            } else {
              setResult([[], true, e, undefined]);
            }
          }
        }
      })();
      return () => {
        disposed = true;
      };
    }
  }, [workspace, namespace, options, nextPageToken, localCacheKey, getRuns]);
  return result;
};

export const useTRPipelineRuns = (
  namespace: string,
  options?: TektonResultsOptions,
): [PipelineRunKind[], boolean, unknown, GetNextPage] => {
  const { workspace } = useWorkspaceInfo();
  const { data, isLoading, isFetchingNextPage, error, fetchNextPage, hasNextPage } =
    useInfiniteQuery(createPipelineRunTektonResultsQueryOptions(namespace, workspace, options));
  const resourceData = React.useMemo(() => {
    return data?.pages ? data.pages.flatMap((page) => page.data) : [];
  }, [data]);
  return [
    resourceData,
    !(isLoading || isFetchingNextPage),
    error,
    hasNextPage ? fetchNextPage : null,
  ];
};

export const useTRPipelineRuns2 = (
  namespace: string,
  options?: TektonResultsOptions,
  cacheKey?: string,
): [PipelineRunKind[], boolean, unknown, GetNextPage] =>
  useTRRuns<PipelineRunKind>(getPipelineRuns, namespace, options, cacheKey);

export const useTRTaskRuns = (
  namespace: string,
  options?: TektonResultsOptions,
): [TaskRunKind[], boolean, unknown, GetNextPage] => {
  const { workspace } = useWorkspaceInfo();
  const { data, isLoading, isFetchingNextPage, error, fetchNextPage, hasNextPage } =
    useInfiniteQuery(createTaskRunTektonResultsQueryOptions(namespace, workspace, options));
  const resourceData = React.useMemo(() => {
    return data?.pages ? data.pages.flatMap((page) => page.data) : [];
  }, [data]);
  return [
    resourceData,
    !(isLoading || isFetchingNextPage),
    error,
    hasNextPage ? fetchNextPage : () => {},
  ];
};

export const useTRTaskRuns2 = (
  namespace: string,
  options?: TektonResultsOptions,
  cacheKey?: string,
): [TaskRunKind[], boolean, unknown, GetNextPage] =>
  useTRRuns(getTaskRuns, namespace, options, cacheKey);

export const useTRTaskRunLog = (
  namespace: string,
  taskRunName: string,
): [string, boolean, unknown] => {
  const { workspace } = useWorkspaceInfo();
  const [result, setResult] = React.useState<[string, boolean, unknown]>([null, false, undefined]);
  React.useEffect(() => {
    let disposed = false;
    if (namespace && taskRunName) {
      void (async () => {
        try {
          const log = await getTaskRunLog(workspace, namespace, taskRunName);
          if (!disposed) {
            setResult([log, true, undefined]);
          }
        } catch (e) {
          if (!disposed) {
            setResult([null, false, e]);
          }
        }
      })();
    }
    return () => {
      disposed = true;
    };
  }, [workspace, namespace, taskRunName]);
  return result;
};
