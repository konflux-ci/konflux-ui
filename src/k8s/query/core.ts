import { QueryClient } from '@tanstack/react-query';
import { HALF_MINUTE } from '~/consts/time';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: HALF_MINUTE,
    },
  },
});

export const getQueryClient = (): QueryClient => queryClient;
