import * as React from 'react';
import { differenceBy, uniqBy } from 'lodash-es';
import { useK8sWatchResource } from '~/k8s';
import { PipelineRunLabel, PipelineRunType } from '../consts/pipelinerun';
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
  },
): [Kind[], boolean, unknown, GetNextPage, NextPageProps] => {
  const etcdRunsRef = React.useRef<Kind[]>([]);
  const optionsMemo = useDeepCompareMemoize(options);
  const limit = optionsMemo?.limit;
  const isList = !optionsMemo?.name;
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

  return React.useMemo(() => {
    const rResources =
      runs && trResources
        ? uniqBy([...runs, ...trResources], (r) => r.metadata.name)
        : runs || trResources;

    return [
      rResources,
      namespace
        ? queryTr
          ? isList
            ? // return loaded only if both sources have loaded
              trLoaded && !isLoading
            : // when searching by name, loading fails if we have no result
              !!rResources?.[0]
          : isList
            ? !isLoading
            : // when searching by name, loading fails if we have no result
              !!rResources?.[0]
        : false,
      namespace
        ? queryTr
          ? isList
            ? trError || error
            : // when searching by name, return an error if we have no result
              trError || (trLoaded && !trResources.length ? error : undefined)
          : error
        : undefined,
      trGetNextPage,
      nextPageProps,
    ];
  }, [
    runs,
    trResources,
    namespace,
    queryTr,
    isList,
    trLoaded,
    isLoading,
    trError,
    error,
    trGetNextPage,
    nextPageProps,
  ]);
};

export const usePipelineRuns = (
  namespace: string,
  options?: {
    selector?: Selector;
    limit?: number;
  },
): [PipelineRunKind[], boolean, unknown, GetNextPage, NextPageProps] =>
  useRuns<PipelineRunKind>(PipelineRunGroupVersionKind, PipelineRunModel, namespace, options);

export const useLatestBuildPipelineRunForComponent = (
  namespace: string,
  componentName: string,
): [PipelineRunKind, boolean, unknown] => {
  const result = usePipelineRuns(
    namespace,
    React.useMemo(
      () => ({
        selector: {
          matchLabels: {
            [PipelineRunLabel.PIPELINE_TYPE]: PipelineRunType.BUILD,
            [PipelineRunLabel.COMPONENT]: componentName,
          },
        },
        limit: 1,
      }),
      [componentName],
    ),
  ) as unknown as [PipelineRunKind[], boolean, unknown];

  return React.useMemo(() => [result[0]?.[0], result[1], result[2]], [result]);
};
