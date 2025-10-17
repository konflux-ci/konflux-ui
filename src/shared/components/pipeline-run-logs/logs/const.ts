import { TQueryOptions } from '~/k8s/query/type';
import { PodKind } from '../../types';

export const LOGS_QUERY_OPTIONS: TQueryOptions<PodKind> = {
  retry: false,
  refetchOnWindowFocus: false,
  refetchInterval: false as const,
};
