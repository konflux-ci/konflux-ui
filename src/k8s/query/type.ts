import { QueryKey, UseInfiniteQueryOptions, UseQueryOptions } from '@tanstack/react-query';

export type TQueryOptions<TResource> = Omit<UseQueryOptions<TResource>, 'queryKey' | 'queryFn'> & {
  filterData?: (resource: TResource) => TResource;
};

export type TQueryInfiniteOptions<
  TQueryFnData = unknown,
  TError = unknown,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
> = Omit<
  UseInfiniteQueryOptions<TQueryFnData, TError, TData, TQueryFnData, TQueryKey, TPageParam>,
  'queryKey' | 'queryFn' | 'initialPageParam' | 'getNextPageParam'
>;
