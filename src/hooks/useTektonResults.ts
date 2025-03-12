import React from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { PipelineRunKind, TaskRunKind } from '../types';
import { getPipelineRunFromTaskRunOwnerRef } from '../utils/common-utils';
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
  const { data, isLoading, isFetchingNextPage, error, fetchNextPage, hasNextPage } =
    useInfiniteQuery(createPipelineRunTektonResultsQueryOptions(namespace, options));
  const resourceData = React.useMemo(() => {
    return data?.pages ? data?.pages?.flatMap((page) => page.data) : [];
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
  const { data, isLoading, isFetchingNextPage, error, fetchNextPage, hasNextPage } =
    useInfiniteQuery(createTaskRunTektonResultsQueryOptions(namespace, options));
  const resourceData = React.useMemo(() => {
    return data?.pages ? data?.pages?.flatMap((page) => page.data) : [];
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
  taskRun: TaskRunKind,
): [string, boolean, unknown] => {
  const [result, setResult] = React.useState<[string, boolean, unknown]>([null, false, undefined]);
  const taskRunUid = taskRun.metadata.uid;
  const pipelineRunUid = getPipelineRunFromTaskRunOwnerRef(taskRun)?.uid;
  React.useEffect(() => {
    let disposed = false;
    if (namespace && taskRunUid) {
      void (async () => {
        try {
          const log = await getTaskRunLog(namespace, taskRunUid, pipelineRunUid);
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
  }, [namespace, taskRunUid, pipelineRunUid]);
  return result;
};
