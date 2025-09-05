import { UseQueryOptions } from '@tanstack/react-query';

export type TQueryOptions<TResource> = Omit<UseQueryOptions<TResource>, 'queryKey' | 'queryFn'> & {
  filterData?: (resource: TResource) => TResource;
};
