import { QueryOptions } from '@tanstack/react-query';

export type TQueryOptions<TResource> = Omit<QueryOptions<TResource>, 'queryKey' | 'queryFn'> & {
  filterData?: (resource: TResource) => TResource;
};
