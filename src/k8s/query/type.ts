import { QueryKey, UseInfiniteQueryOptions, UseQueryOptions } from '@tanstack/react-query';

/**
 * Query options accepted by `useK8sWatchResource` and its helper utilities.
 *
 * @typeParam TResource - The data type returned by the hook.
 * @typeParam TQueryFnData - The raw data returned by `queryFn` (defaults to
 *   `TResource`).  When the `queryFn` fetches a different shape (e.g. a K8s
 *   Table response) that is later transformed via `select`, set this to the
 *   raw response type so both `queryFn` and `select` are correctly typed.
 */
export type TQueryOptions<TResource, TQueryFnData = TResource> = Omit<
  UseQueryOptions<TQueryFnData, Error, TResource>,
  'queryKey' | 'queryFn'
> & {
  filterData?: (resource: TResource) => TResource;
  queryKey?: UseQueryOptions<TQueryFnData>['queryKey'];
  queryFn?: UseQueryOptions<TQueryFnData>['queryFn'];
};

export type TQueryInfiniteOptions<
  TQueryFnData = unknown,
  TError = unknown,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
> = Omit<
  UseInfiniteQueryOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam>,
  'queryKey' | 'queryFn' | 'initialPageParam' | 'getNextPageParam'
>;
