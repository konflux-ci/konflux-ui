import * as React from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { createTestQueryClient, createK8sUtilMock } from '~/unit-test-utils';
import { K8sModelCommon, K8sResourceCommon, WatchK8sResource } from '../../types/k8s';
import { withKubearchivePathPrefix } from '../fetch-utils';
import { useIsKubeArchiveEnabled } from '../conditional-checks';
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

describe('useKubearchiveListResourceQuery - additional scenarios', () => {
  // The project uses Jest and @testing-library/react hooks utilities.
  // These tests extend coverage for pagination, feature-flag behavior, and namespace handling.

  const createWrapper = () => {
    const queryClient = createTestQueryClient();
    return ({ children }: { children: React.ReactNode }) =>
      React.createElement(QueryClientProvider, { client: queryClient }, children);
  };

  const baseModel: K8sModelCommon = {
    apiGroup: 'apps',
    apiVersion: 'v1',
    kind: 'Release',
    plural: 'releases',
    namespaced: true,
  };

  const baseResource: WatchK8sResource = {
    groupVersionKind: {
      group: 'apps',
      version: 'v1',
      kind: 'Release',
    },
    namespace: 'test-namespace',
  };

  const makeItem = (name: string, uid: string): K8sResourceCommon => ({
    apiVersion: 'v1',
    kind: 'Release',
    metadata: {
      name,
      namespace: 'test-namespace',
      uid,
    },
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('paginates when metadata.continue is present and uses the token on subsequent fetches', async () => {
    const page1Items = [makeItem('rel-1', 'u1')];
    const page2Items = [makeItem('rel-2', 'u2'), makeItem('rel-3', 'u3')];

    const page1 = {
      apiVersion: 'v1',
      kind: 'ReleaseList',
      metadata: { continue: 'ct-1' },
      items: page1Items,
    };

    const page2 = {
      apiVersion: 'v1',
      kind: 'ReleaseList',
      metadata: {}, // no further continue -> end of pagination
      items: page2Items,
    };

    // First call returns page1 with a continue token; second returns page2
    mockK8sListResource.mockResolvedValueOnce(page1).mockResolvedValueOnce(page2);

    const { result } = renderHook(
      () => useKubearchiveListResourceQuery(baseResource, baseModel),
      { wrapper: createWrapper() },
    );

    // First page should resolve successfully and indicate there is a next page
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
      expect(result.current.hasNextPage).toBe(true);
    });

    // Verify first call did not pass a continue token
    const firstCallArgs = mockK8sListResource.mock.calls[0]?.[0];
    expect(firstCallArgs).toEqual(
      expect.objectContaining({
        model: baseModel,
        queryOptions: expect.objectContaining({
          queryParams: expect.objectContaining({
            continue: undefined,
          }),
        }),
      }),
    );

    // Fetch next page
    await result.current.fetchNextPage();

    // After fetching the next page, there should be no further pages
    await waitFor(() => {
      expect(result.current.hasNextPage).toBe(false);
      expect(result.current.data?.pages).toHaveLength(2);
    });

    // Data pages should contain item arrays per page
    expect(result.current.data?.pages?.[0]).toEqual(page1Items);
    expect(result.current.data?.pages?.[1]).toEqual(page2Items);

    // Verify that the second call used the continue token from page1
    const secondCallArgs = mockK8sListResource.mock.calls[1]?.[0];
    expect(secondCallArgs).toEqual(
      expect.objectContaining({
        model: baseModel,
        queryOptions: expect.objectContaining({
          queryParams: expect.objectContaining({
            continue: 'ct-1',
          }),
        }),
      }),
    );
  });

  it('does not prefix requests when Kubearchive feature is disabled', async () => {
    // Disable the feature for this invocation only
    (useIsKubeArchiveEnabled as jest.Mock).mockReturnValueOnce({ isKubearchiveEnabled: false });

    const listResponse = {
      apiVersion: 'v1',
      kind: 'ReleaseList',
      metadata: {},
      items: [makeItem('rel-x', 'ux')],
    };
    mockK8sListResource.mockResolvedValue(listResponse);

    const { result } = renderHook(
      () => useKubearchiveListResourceQuery(baseResource, baseModel),
      { wrapper: createWrapper() },
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // When disabled, the prefix helper should not be invoked
    expect((withKubearchivePathPrefix as jest.Mock)).not.toHaveBeenCalled();

    // Still should return data successfully
    expect(result.current.data?.pages?.[0]).toEqual(listResponse.items);
  });

  it('omits namespace for cluster-scoped models (namespaced=false)', async () => {
    // Cluster-scoped model and resource (no namespace)
    const clusterModel: K8sModelCommon = {
      ...baseModel,
      namespaced: false,
      kind: 'ClusterRelease',
      plural: 'clusterreleases',
    };

    const clusterResource: WatchK8sResource = {
      groupVersionKind: {
        group: 'apps',
        version: 'v1',
        kind: 'ClusterRelease',
      },
      // intentionally no namespace
    };

    const listResponse = {
      apiVersion: 'v1',
      kind: 'ClusterReleaseList',
      metadata: {},
      items: [
        {
          apiVersion: 'v1',
          kind: 'ClusterRelease',
          metadata: { name: 'cluster-rel', uid: 'c1' },
        },
      ],
    };
    mockK8sListResource.mockResolvedValue(listResponse);

    renderHook(() => useKubearchiveListResourceQuery(clusterResource, clusterModel), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      // Validate call arguments do not include namespace when model is cluster-scoped.
      const callArgs = mockK8sListResource.mock.calls[0]?.[0];

      // We assert that neither a top-level 'namespace' option nor a query param is present.
      expect(callArgs).toEqual(
        expect.objectContaining({
          model: clusterModel,
          queryOptions: expect.objectContaining({
            queryParams: expect.not.objectContaining({
              namespace: expect.anything(),
            }),
          }),
        }),
      );
      expect(callArgs).not.toHaveProperty('namespace');
    });
  });
});