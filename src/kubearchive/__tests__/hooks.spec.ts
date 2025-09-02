import * as React from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { createTestQueryClient, createK8sUtilMock } from '~/unit-test-utils';
import { K8sModelCommon, K8sResourceCommon, WatchK8sResource } from '../../types/k8s';
import { useKubearchiveListResourceQuery } from '../hooks';

// Mock the kubearchive utilities
jest.mock('../fetch-utils', () => ({
  withKubearchivePathPrefix: jest.fn((options) => options),
}));

jest.mock('../conditional-checks', () => ({
  useIsKubeArchiveEnabled: jest.fn(() => ({ isKubearchiveEnabled: true })),
}));

const mockK8sListResource = createK8sUtilMock('k8sListResource');

describe('useKubearchiveListResourceQuery', () => {
  const createWrapper = () => {
    const queryClient = createTestQueryClient();
    return ({ children }: { children: React.ReactNode }) =>
      React.createElement(QueryClientProvider, { client: queryClient }, children);
  };

  const mockModel: K8sModelCommon = {
    apiGroup: 'apps',
    apiVersion: 'v1',
    kind: 'Release',
    plural: 'releases',
    namespaced: true,
  };

  const mockResourceInit: WatchK8sResource = {
    groupVersionKind: {
      group: 'apps',
      version: 'v1',
      kind: 'Release',
    },
    namespace: 'test-namespace',
  };

  const mockReleaseList: K8sResourceCommon[] = [
    {
      apiVersion: 'v1',
      kind: 'Release',
      metadata: {
        name: 'test-release-1',
        namespace: 'test-namespace',
        uid: 'uid-1',
      },
    },
    {
      apiVersion: 'v1',
      kind: 'Release',
      metadata: {
        name: 'test-release-2',
        namespace: 'test-namespace',
        uid: 'uid-2',
      },
    },
  ];

  const mockListResponse = {
    apiVersion: 'v1',
    kind: 'ReleaseList',
    metadata: {},
    items: mockReleaseList,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch kubearchive resources successfully', async () => {
    mockK8sListResource.mockResolvedValue(mockListResponse);

    const { result } = renderHook(
      () => useKubearchiveListResourceQuery(mockResourceInit, mockModel),
      {
        wrapper: createWrapper(),
      },
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data?.pages).toHaveLength(1);
    expect(result.current.data?.pages[0]).toEqual(mockReleaseList);
    expect(mockK8sListResource).toHaveBeenCalledWith(
      expect.objectContaining({
        model: mockModel,
        queryOptions: expect.objectContaining({
          queryParams: expect.objectContaining({
            continue: undefined,
          }),
        }),
      }),
    );
  });

  it('should handle no continue token correctly', async () => {
    mockK8sListResource.mockResolvedValue(mockListResponse);

    const { result } = renderHook(
      () => useKubearchiveListResourceQuery(mockResourceInit, mockModel),
      {
        wrapper: createWrapper(),
      },
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.hasNextPage).toBe(false);
  });

  it('should handle errors properly', async () => {
    const mockError = new Error('Network error');
    mockK8sListResource.mockRejectedValue(mockError);

    const { result } = renderHook(
      () => useKubearchiveListResourceQuery(mockResourceInit, mockModel),
      {
        wrapper: createWrapper(),
      },
    );

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toEqual(mockError);
  });

  it('should handle empty resource list', async () => {
    const emptyResponse = {
      ...mockListResponse,
      items: [],
    };
    mockK8sListResource.mockResolvedValue(emptyResponse);

    const { result } = renderHook(
      () => useKubearchiveListResourceQuery(mockResourceInit, mockModel),
      {
        wrapper: createWrapper(),
      },
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data?.pages[0]).toEqual([]);
  });

  it('should pass through query parameters correctly', async () => {
    const resourceInitWithParams: WatchK8sResource = {
      ...mockResourceInit,
      fieldSelector: 'status.phase=Running',
      selector: { app: 'test' },
    };

    mockK8sListResource.mockResolvedValue(mockListResponse);

    renderHook(() => useKubearchiveListResourceQuery(resourceInitWithParams, mockModel), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(mockK8sListResource).toHaveBeenCalledWith(
        expect.objectContaining({
          queryOptions: expect.objectContaining({
            queryParams: expect.objectContaining({
              fieldSelector: 'status.phase=Running',
              labelSelector: { app: 'test' },
            }),
          }),
        }),
      );
    });
  });

  it('should be loading initially', () => {
    mockK8sListResource.mockImplementation(() => new Promise(() => {})); // Never resolves

    const { result } = renderHook(
      () => useKubearchiveListResourceQuery(mockResourceInit, mockModel),
      {
        wrapper: createWrapper(),
      },
    );

    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeUndefined();
  });
});
