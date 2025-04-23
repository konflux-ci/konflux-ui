/* eslint-disable no-console */
import * as React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { createTestQueryClient } from '~/unit-test-utils/mock-react-query';
import { OpenAPISchemaDefinitions } from '../../types';
import { useSwaggerDefinitions } from '../useSwaggerDefinitions';

const mockCommonFetch = jest.fn();

jest.mock('../../../../../k8s', () => ({
  commonFetch: (...args: unknown[]) => mockCommonFetch(...args),
}));

describe('useSwaggerDefinitions', () => {
  let queryClient: QueryClient;

  const renderHookWithQueryClient = () => {
    return renderHook(() => useSwaggerDefinitions(), {
      wrapper: ({ children }) =>
        React.createElement(QueryClientProvider, { client: queryClient }, children),
    });
  };

  beforeEach(() => {
    queryClient = createTestQueryClient();
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('should return loading state initially', () => {
    mockCommonFetch.mockImplementation(() => new Promise(() => {}));

    const { result } = renderHookWithQueryClient();

    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeUndefined();
  });

  it('should return definitions when fetch succeeds with valid data', async () => {
    const mockDefinitions: OpenAPISchemaDefinitions = {
      'io.k8s.api.core.v1.Pod': {
        type: 'object',
        properties: {
          metadata: { type: 'object' },
        },
      },
    };

    const mockResponse = {
      json: jest.fn().mockResolvedValue({ definitions: mockDefinitions }),
    };

    mockCommonFetch.mockResolvedValue(mockResponse as unknown as Response);

    const { result } = renderHookWithQueryClient();

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockCommonFetch).toHaveBeenCalledWith('/openapi/v2');
    expect(result.current.data).toEqual(mockDefinitions);
    expect(result.current.isError).toBe(false);
  });

  it('should return null when definitions are missing in response', async () => {
    const mockResponse = {
      json: jest.fn().mockResolvedValue({}),
    };

    mockCommonFetch.mockResolvedValue(mockResponse as unknown as Response);

    const { result } = renderHookWithQueryClient();

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toBeNull();
    expect(console.error).toHaveBeenCalledWith('Definitions missing in OpenAPI response.');
  });

  it('should return null and log error when fetch fails', async () => {
    const error = new Error('Network error');
    mockCommonFetch.mockRejectedValue(error);

    const { result } = renderHookWithQueryClient();

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toBeNull();
    expect(console.error).toHaveBeenCalledWith('Could not get OpenAPI definitions', error);
  });

  it('should use correct query key and staleTime', () => {
    mockCommonFetch.mockImplementation(() => new Promise(() => {}));

    renderHookWithQueryClient();

    const queryCache = queryClient.getQueryCache();
    const queries = queryCache.getAll();
    expect(queries).toHaveLength(1);
    expect(queries[0].queryKey).toEqual(['swagger']);

    expect((queries[0].options as { staleTime?: number }).staleTime).toBe(Infinity);
  });
});
