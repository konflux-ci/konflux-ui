import { QueryKey, UseInfiniteQueryOptions, UseQueryOptions } from '@tanstack/react-query';

export type TQueryOptions<TResource> = Omit<UseQueryOptions<TResource>, 'queryKey' | 'queryFn'> & {
  filterData?: (resource: TResource) => TResource;
};

export type TQueryInfiniteOptions<
  TQueryFnData = unknown,
  TError = unknown,
  TData = TQueryFnData,
  TQueryData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
> = Omit<
  UseInfiniteQueryOptions<TQueryFnData, TError, TData, TQueryData, TQueryKey, TPageParam>,
  'queryKey' | 'queryFn' | 'initialPageParam' | 'getNextPageParam'
>;
