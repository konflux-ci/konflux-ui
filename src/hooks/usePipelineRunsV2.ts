import * as React from 'react';
import { differenceBy } from 'lodash-es';
import { useIsOnFeatureFlag } from '~/feature-flags/hooks';
import { useKubearchiveListResourceQuery } from '~/kubearchive/hooks';
import { useK8sWatchResource } from '../k8s';
import { PipelineRunGroupVersionKind, PipelineRunModel } from '../models';
import { useDeepCompareMemoize } from '../shared';
import { PipelineRunKind } from '../types';
import { K8sGroupVersionKind, K8sModelCommon, K8sResourceCommon, Selector } from '../types/k8s';
import { getCommitSha } from '../utils/commits-utils';
import { EQ } from '../utils/tekton-results';
import { GetNextPage, NextPageProps, useTRPipelineRuns, useTRTaskRuns } from './useTektonResults';

const useRuns = <Kind extends K8sResourceCommon>(
  groupVersionKind: K8sGroupVersionKind,
  model: K8sModelCommon,
  namespace: string,
  options?: {
    selector?: Selector;
    limit?: number;
    name?: string;
    watch?: boolean;
    enabled?: boolean;
  },
  queryOptions?: { enabled?: boolean },
): [Kind[], boolean, unknown, GetNextPage, NextPageProps] => {
  //   console.log('Version 2 called');
  const etcdRunsRef = React.useRef<Kind[]>([]);
  const optionsMemo = useDeepCompareMemoize(options);
  const limit = optionsMemo?.limit;
  const isList = !optionsMemo?.name;
  const kubearchiveEnabled = useIsOnFeatureFlag('pipelineruns-kubearchive');
  const isEnabled = (queryOptions?.enabled ?? options?.enabled) !== false;
  //   const watch = options?.watch !== false;
  // do not include the limit when querying etcd because result order is not sorted
  const watchOptions = React.useMemo(() => {
    // reset cached runs as the options have changed
    etcdRunsRef.current = [];
    return namespace
      ? {
          groupVersionKind,
          namespace,
          isList,
          selector: optionsMemo?.selector,
          name: optionsMemo?.name,
          watch: true,
        }
      : null;
  }, [namespace, groupVersionKind, isList, optionsMemo?.selector, optionsMemo?.name]);
  const {
    data: resources,
    isLoading,
    error,
  } = useK8sWatchResource<Kind[]>(watchOptions, model, { retry: false });
  // if a pipeline run was removed from etcd, we want to still include it in the return value without re-querying tekton-results
  const etcdRuns = React.useMemo(() => {
    if (isLoading || error) {
      return [];
    }
    const resourcesArray = (isList ? resources : [resources]) as Kind[];

    if (!options?.selector?.filterByCommit) {
      return resourcesArray;
    }

    return (
      resourcesArray?.filter(
        (plr) =>
          getCommitSha(plr as unknown as PipelineRunKind) === options.selector.filterByCommit,
      ) ?? []
    );
  }, [isList, options?.selector?.filterByCommit, resources, isLoading, error]);

  const runs = React.useMemo(() => {
    if (!etcdRuns) {
      return etcdRuns;
    }
    let value = etcdRunsRef.current
      ? [
          ...etcdRuns,
          // identify the runs that were removed
          ...differenceBy(etcdRunsRef.current, etcdRuns, (plr) => plr.metadata.name),
        ]
      : [...etcdRuns];
    value.sort((a, b) => b.metadata.creationTimestamp.localeCompare(a.metadata.creationTimestamp));
    if (limit && limit < value.length) {
      value = value.slice(0, limit);
    }
    return value;
  }, [etcdRuns, limit]);

  // cache the last set to identify removed runs
  etcdRunsRef.current = runs;

  // Query tekton results if there's no limit or we received less items from etcd than the current limit
  const queryTr =
    !limit || (namespace && ((runs && !isLoading && optionsMemo.limit > runs.length) || error));

  const trOptions: typeof optionsMemo = React.useMemo(() => {
    if (optionsMemo?.name) {
      const { name, ...rest } = optionsMemo;
      return {
        ...rest,
        filter: EQ('data.metadata.name', name),
      };
    }
    return optionsMemo;
  }, [optionsMemo]);

  // tekton-results includes items in etcd, therefore options must use the same limit
  // these duplicates will later be de-duped
  const [trResources, trLoaded, trError, trGetNextPage, nextPageProps] = (
    groupVersionKind === PipelineRunGroupVersionKind ? useTRPipelineRuns : useTRTaskRuns
  )(queryTr ? namespace : null, trOptions) as [
    Kind[],
    boolean,
    unknown,
    GetNextPage,
    NextPageProps,
  ];

  //   console.log('Tekton Results', trResources);

  const resourceInit = React.useMemo(
    () => ({
      groupVersionKind: PipelineRunGroupVersionKind,
      namespace,
      //   watch:true,
      isList: true,
      //   limit: options.limit,
    }),
    [namespace],
  );

  const kubearchiveResult = useKubearchiveListResourceQuery(resourceInit, PipelineRunModel);

  const kubearchiveData = React.useMemo(() => {
    const pages = kubearchiveResult.data?.pages;
    return pages?.flatMap((page) => page) ?? [];
  }, [kubearchiveResult.data?.pages]);

  //   console.log(
  //     'Kubearchive Result',
  //     kubearchiveResult,
  //     'Data',
  //     kubearchiveResult?.data,
  //     'processed',
  //     kubearchiveData,
  //   );

  // Apply sorting and limit to KubeArchive data
  const processedKubearchiveData = React.useMemo(() => {
    if (!kubearchiveEnabled) return [];

    const data = kubearchiveData as PipelineRunKind[];
    const toKey = (tr?: PipelineRunKind) => tr?.metadata?.creationTimestamp ?? '';
    // Sort by creationTimestamp (newest first); stable for equal keys
    const sorted = [...data].sort((a, b) => toKey(b).localeCompare(toKey(a)));

    // Apply limit if specified
    return options?.limit && options.limit > 0 ? sorted.slice(0, options.limit) : sorted;
  }, [kubearchiveEnabled, kubearchiveData, options?.limit]);

  // Return the appropriate data based on feature flag
  return React.useMemo(() => {
    if (kubearchiveEnabled) {
      const isLoadingKubeArchive = !isEnabled || !namespace ? false : kubearchiveResult.isLoading;
      const isError = !isEnabled || !namespace ? undefined : kubearchiveResult.error;
      const getNextPage = kubearchiveResult.hasNextPage
        ? kubearchiveResult.fetchNextPage
        : undefined;
      const nextPagePropsKubeArchive = {
        hasNextPage: kubearchiveResult.hasNextPage || false,
        isFetchingNextPage: kubearchiveResult.isFetchingNextPage || false,
      };

      return [
        processedKubearchiveData,
        !isLoadingKubeArchive,
        isError,
        getNextPage,
        nextPagePropsKubeArchive,
      ];
    }
    return [trResources || [], trLoaded, trError, trGetNextPage, nextPageProps];
  }, [
    trResources,
    kubearchiveEnabled,
    processedKubearchiveData,
    kubearchiveResult.isLoading,
    kubearchiveResult.error,
    kubearchiveResult.hasNextPage,
    kubearchiveResult.fetchNextPage,
    kubearchiveResult.isFetchingNextPage,
    trLoaded,
    trError,
    trGetNextPage,
    nextPageProps,
    isEnabled,
    namespace,
  ]);
};

// ---------------------------------------------------------

export const usePipelineRunsV2 = (
  namespace: string,
  options?: {
    selector?: Selector;
    limit?: number;
  },
): [PipelineRunKind[], boolean, unknown, GetNextPage, NextPageProps] =>
  useRuns<PipelineRunKind>(PipelineRunGroupVersionKind, PipelineRunModel, namespace, options);
