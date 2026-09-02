import * as React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RenderHookOptions, RenderOptions, render, renderHook } from '@testing-library/react';

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

export function renderHookWithQueryClient<TResult, TProps>(
  hook: (props: TProps) => TResult,
  options?: Omit<RenderHookOptions<TProps>, 'wrapper'> & { client?: QueryClient },
) {
  const { client, ...hookOptions } = options ?? {};
  const queryClient = client ?? createTestQueryClient();

  function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: queryClient }, children);
  }

  return renderHook(hook, { ...hookOptions, wrapper: Wrapper });
}
