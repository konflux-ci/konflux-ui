import React from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useWorkspaceInfo } from '../components/Workspace/useWorkspaceInfo';
import { PipelineRunKind, TaskRunKind } from '../types';
import {
  TektonResultsOptions,
  getTaskRunLog,
  createPipelineRunTektonResultsQueryOptions,
  createTaskRunTektonResultsQueryOptions,
} from '../utils/tekton-results';

export type GetNextPage = () => void | undefined;
export type NextPageProps = {
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
};

export const useTRPipelineRuns = (
  namespace: string,
  options?: TektonResultsOptions,
): [PipelineRunKind[], boolean, unknown, GetNextPage, NextPageProps] => {
  const { workspace } = useWorkspaceInfo();
  const { data, isLoading, isFetchingNextPage, error, fetchNextPage, hasNextPage } =
    useInfiniteQuery(createPipelineRunTektonResultsQueryOptions(namespace, workspace, options));
  const resourceData = React.useMemo(() => {
    return data?.pages ? data.pages.flatMap((page) => page.data) : [];
  }, [data]);
  return [
    resourceData,
    !isLoading,
    error,
    hasNextPage ? fetchNextPage : null,
    {
      isFetchingNextPage,
      hasNextPage,
    },
  ];
};

export const useTRTaskRuns = (
  namespace: string,
  options?: TektonResultsOptions,
): [TaskRunKind[], boolean, unknown, GetNextPage, NextPageProps] => {
  const { workspace } = useWorkspaceInfo();
  const { data, isLoading, isFetchingNextPage, error, fetchNextPage, hasNextPage } =
    useInfiniteQuery(createTaskRunTektonResultsQueryOptions(namespace, workspace, options));
  const resourceData = React.useMemo(() => {
    return data?.pages ? data.pages.flatMap((page) => page.data) : [];
  }, [data]);
  return [
    resourceData,
    !isLoading,
    error,
    hasNextPage ? fetchNextPage : null,
    {
      isFetchingNextPage,
      hasNextPage,
    },
  ];
};

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
