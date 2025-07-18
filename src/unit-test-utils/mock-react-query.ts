import * as React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RenderOptions, render } from '@testing-library/react';

export function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
}

export function renderWithQueryClient(
  ui: React.ReactElement,
  client?: QueryClient,
  renderOptions?: Omit<RenderOptions, 'wrapper'>,
) {
  const queryClient = client ?? createTestQueryClient();

  function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: queryClient }, children);
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions });
}
