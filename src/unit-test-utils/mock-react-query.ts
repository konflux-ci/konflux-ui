import * as React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RenderOptions, render } from '@testing-library/react';

/**
 * Creates a test QueryClient with optimized settings for testing
 */
export function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
}

/**
 * Renders a component with QueryClient provider
 */
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
