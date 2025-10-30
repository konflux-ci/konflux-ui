import React from 'react';
import { InfiniteData, useInfiniteQuery } from '@tanstack/react-query';
import { TQueryInfiniteOptions } from '~/k8s/query/type';
import { K8sResourceCommon } from '~/types/k8s';
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

const selector = <T extends K8sResourceCommon>(data: { pages: { data: T[] }[] }) =>
  data?.pages?.flatMap((page) => page.data) ?? [];

export const useTRPipelineRuns = (
  namespace: string,
  options?: TektonResultsOptions,
  queryOptions?: TQueryInfiniteOptions<PipelineRunKind>,
): [PipelineRunKind[], boolean, unknown, GetNextPage, NextPageProps] => {
  const { data, isLoading, isFetchingNextPage, error, fetchNextPage, hasNextPage } =
    useInfiniteQuery({
      ...createPipelineRunTektonResultsQueryOptions(namespace, options),
      ...(queryOptions ?? ({} as TQueryInfiniteOptions<PipelineRunKind>)),
      select: selector<PipelineRunKind>,
    });
  return [
    data ?? [],
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
  queryOptions?: TQueryInfiniteOptions<TaskRunKind[], Error, InfiniteData<TaskRunKind[], unknown>>,
): [TaskRunKind[], boolean, unknown, GetNextPage, NextPageProps] => {
  const { data, isLoading, isFetchingNextPage, error, fetchNextPage, hasNextPage } =
    useInfiniteQuery({
      ...createTaskRunTektonResultsQueryOptions(namespace, options),
      ...(queryOptions ?? ({} as TQueryInfiniteOptions<TaskRunKind>)),
      select: selector<TaskRunKind>,
    });
  return [
    data ?? [],
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
