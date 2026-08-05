import { QueryCache, QueryClient } from '@tanstack/react-query';
import { monitoringService } from '~/monitoring';

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => {
      monitoringService?.captureException(error, {
        queryKey: JSON.stringify(query.queryKey),
      });
    },
  }),
  defaultOptions: {
    queries: {
      staleTime: 30_000,
    },
  },
});

export const getQueryClient = (): QueryClient => queryClient;
