/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-argument */

import * as React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook } from '@testing-library/react';
import { useKubearchiveListResourceQuery } from '../../kubearchive/hooks';
import { K8sResourceCommon, K8sModelCommon, WatchK8sResource } from '../../types/k8s';
import { createK8sWatchResourceMock, createTestQueryClient } from '../../utils/test-utils';
import { useK8sAndKarchResources } from '../useK8sAndKarchResources';

// Mock the kubearchive hooks
jest.mock('../../kubearchive/hooks', () => ({
  useKubearchiveListResourceQuery: jest.fn(),
}));

const mockUseK8sWatchResource = createK8sWatchResourceMock();
const mockUseKubearchiveListResourceQuery = useKubearchiveListResourceQuery as jest.MockedFunction<
  typeof useKubearchiveListResourceQuery
>;

// Sample test data
interface TestResource extends K8sResourceCommon {
  apiVersion: string;
  kind: string;
  metadata: {
    name: string;
    namespace?: string;
    uid?: string;
  };
  spec?: any;
}

const mockModel: K8sModelCommon = {
  apiVersion: 'v1',
  kind: 'TestResource',
  plural: 'testresources',
};

const testResource1: TestResource = {
  apiVersion: 'v1',
  kind: 'TestResource',
  metadata: {
    name: 'resource-1',
    namespace: 'test-ns',
    uid: 'uid-1',
  },
  spec: { test: 'data1' },
};

const testResource2: TestResource = {
  apiVersion: 'v1',
  kind: 'TestResource',
  metadata: {
    name: 'resource-2',
    namespace: 'test-ns',
    uid: 'uid-2',
  },
  spec: { test: 'data2' },
};

const archiveResource: TestResource = {
  apiVersion: 'v1',
  kind: 'TestResource',
  metadata: {
    name: 'archive-resource',
    namespace: 'test-ns',
    uid: 'uid-archive',
  },
  spec: { test: 'archive-data' },
};

// Duplicate resource (same UID as testResource1)
const duplicateResource: TestResource = {
  apiVersion: 'v1',
  kind: 'TestResource',
  metadata: {
    name: 'resource-1-duplicate',
    namespace: 'test-ns',
    uid: 'uid-1', // Same UID as testResource1
  },
  spec: { test: 'duplicate-data' },
};

describe('useK8sAndKarchResources', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    jest.clearAllMocks();
  });

  const renderHookWithQueryClient = (resourceInit: WatchK8sResource | undefined) => {
    return renderHook(() => useK8sAndKarchResources<TestResource>(resourceInit, mockModel), {
      wrapper: ({ children }) =>
        React.createElement(QueryClientProvider, { client: queryClient }, children),
    });
  };

  it('should return loading states correctly', () => {
    // Mock both hooks as loading
    mockUseK8sWatchResource.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
      isError: false,
      isFetching: false,
      isSuccess: false,
      status: 'loading',
      fetchStatus: 'fetching',
      errorUpdateCount: 0,
      errorUpdatedAt: 0,
      failureCount: 0,
      failureReason: null,
      isInitialLoading: true,
      isLoadingError: false,
      isPaused: false,
      isPlaceholderData: false,
      isPreviousData: false,
      isRefetchError: false,
      isRefetching: false,
      isStale: false,
      refetch: jest.fn(),
      remove: jest.fn(),
      dataUpdatedAt: 0,
    });

    // @ts-expect-error - Mocking partial infinite query result for testing
    mockUseKubearchiveListResourceQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
      isError: false,
      hasNextPage: false,
      isFetchingNextPage: false,
      fetchNextPage: jest.fn(),
    });

    const { result } = renderHookWithQueryClient({
      groupVersionKind: { group: '', version: 'v1', kind: 'TestResource' },
      namespace: 'test-ns',
    });

    expect(result.current.clusterLoading).toBe(true);
    expect(result.current.archiveLoading).toBe(true);
    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toEqual([]);
  });

  it('should combine and deduplicate data from cluster and archive', () => {
    // Mock cluster data
    mockUseK8sWatchResource.mockReturnValue({
      data: [testResource1, testResource2],
      isLoading: false,
      error: null,
    } as any);

    // Mock archive data with one unique resource and one duplicate
    mockUseKubearchiveListResourceQuery.mockReturnValue({
      data: {
        pages: [[archiveResource, duplicateResource]], // duplicateResource has same UID as testResource1
        pageParams: [undefined],
      },
      isLoading: false,
      error: null,
      hasNextPage: false,
      isFetchingNextPage: false,
      fetchNextPage: jest.fn(),
    } as any);

    const { result } = renderHookWithQueryClient({
      groupVersionKind: { group: '', version: 'v1', kind: 'TestResource' },
      namespace: 'test-ns',
    });

    expect(result.current.data).toHaveLength(3); // testResource1, testResource2, archiveResource (duplicateResource excluded)
    expect(result.current.data).toContainEqual(testResource1);
    expect(result.current.data).toContainEqual(testResource2);
    expect(result.current.data).toContainEqual(archiveResource);
    expect(result.current.data).not.toContainEqual(duplicateResource);
  });

  it('should handle deduplication based on name-namespace when UID is missing', () => {
    const resourceNoUid1: TestResource = {
      apiVersion: 'v1',
      kind: 'TestResource',
      metadata: {
        name: 'resource-no-uid',
        namespace: 'test-ns',
      },
    };

    const resourceNoUid2: TestResource = {
      apiVersion: 'v1',
      kind: 'TestResource',
      metadata: {
        name: 'resource-no-uid', // Same name-namespace
        namespace: 'test-ns',
      },
    };

    mockUseK8sWatchResource.mockReturnValue({
      data: [resourceNoUid1],
      isLoading: false,
      error: null,
    } as any);

    mockUseKubearchiveListResourceQuery.mockReturnValue({
      data: {
        pages: [[resourceNoUid2]], // Same name-namespace as cluster resource
        pageParams: [undefined],
      },
      isLoading: false,
      error: null,
    } as any);

    const { result } = renderHookWithQueryClient({
      groupVersionKind: { group: '', version: 'v1', kind: 'TestResource' },
      namespace: 'test-ns',
    });

    expect(result.current.data).toHaveLength(1); // Only one resource should remain
    expect(result.current.data[0]).toEqual(resourceNoUid1);
  });

  it('should handle error states correctly', () => {
    const clusterError = new Error('Cluster error');
    const archiveError = new Error('Archive error');

    mockUseK8sWatchResource.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: clusterError,
    } as any);

    mockUseKubearchiveListResourceQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: archiveError,
    } as any);

    const { result } = renderHookWithQueryClient({
      groupVersionKind: { group: '', version: 'v1', kind: 'TestResource' },
      namespace: 'test-ns',
    });

    expect(result.current.clusterError).toBe(clusterError);
    expect(result.current.archiveError).toBe(archiveError);
    expect(result.current.hasError).toBe(true);
  });

  it('should handle partial error states', () => {
    const clusterError = new Error('Cluster error');

    mockUseK8sWatchResource.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: clusterError,
    } as any);

    mockUseKubearchiveListResourceQuery.mockReturnValue({
      data: {
        pages: [[archiveResource]],
      },
      isLoading: false,
      error: null,
    } as any);

    const { result } = renderHookWithQueryClient({
      groupVersionKind: { group: '', version: 'v1', kind: 'TestResource' },
      namespace: 'test-ns',
    });

    expect(result.current.clusterError).toBe(clusterError);
    expect(result.current.archiveError).toBe(null);
    expect(result.current.hasError).toBe(true);
    expect(result.current.data).toEqual([archiveResource]); // Should still show archive data
  });

  it('should pass through archive infinite query utilities', () => {
    const mockFetchNextPage = jest.fn();

    mockUseK8sWatchResource.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    } as any);

    mockUseKubearchiveListResourceQuery.mockReturnValue({
      data: {
        pages: [[testResource1]],
      },
      isLoading: false,
      error: null,
      hasNextPage: true,
      isFetchingNextPage: false,
      fetchNextPage: mockFetchNextPage,
    } as any);

    const { result } = renderHookWithQueryClient({
      groupVersionKind: { group: '', version: 'v1', kind: 'TestResource' },
      namespace: 'test-ns',
    });

    expect(result.current.hasNextPage).toBe(true);
    expect(result.current.isFetchingNextPage).toBe(false);
    expect(result.current.fetchNextPage).toBe(mockFetchNextPage);
  });

  it('should handle multiple archive pages correctly', () => {
    mockUseK8sWatchResource.mockReturnValue({
      data: [testResource1],
      isLoading: false,
      error: null,
    } as any);

    mockUseKubearchiveListResourceQuery.mockReturnValue({
      data: {
        pages: [[testResource2], [archiveResource]],
      },
      isLoading: false,
      error: null,
    } as any);

    const { result } = renderHookWithQueryClient({
      groupVersionKind: { group: '', version: 'v1', kind: 'TestResource' },
      namespace: 'test-ns',
    });

    expect(result.current.data).toHaveLength(3);
    expect(result.current.data).toContainEqual(testResource1);
    expect(result.current.data).toContainEqual(testResource2);
    expect(result.current.data).toContainEqual(archiveResource);
  });

  it('should return raw data for advanced use cases', () => {
    const clusterData = [testResource1, testResource2];
    const archivePages = [[archiveResource]];

    mockUseK8sWatchResource.mockReturnValue({
      data: clusterData,
      isLoading: false,
      error: null,
    } as any);

    mockUseKubearchiveListResourceQuery.mockReturnValue({
      data: {
        pages: archivePages,
      },
      isLoading: false,
      error: null,
    } as any);

    const { result } = renderHookWithQueryClient({
      groupVersionKind: { group: '', version: 'v1', kind: 'TestResource' },
      namespace: 'test-ns',
    });

    expect(result.current.clusterData).toBe(clusterData);
    expect(result.current.archiveData).toBe(archivePages);
  });

  it('should handle undefined resourceInit', () => {
    mockUseK8sWatchResource.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
    } as any);

    mockUseKubearchiveListResourceQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
    } as any);

    const { result } = renderHookWithQueryClient(undefined);

    expect(result.current.data).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.hasError).toBe(false);
  });

  it('should handle empty data correctly', () => {
    mockUseK8sWatchResource.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    } as any);

    mockUseKubearchiveListResourceQuery.mockReturnValue({
      data: {
        pages: [],
      },
      isLoading: false,
      error: null,
    } as any);

    const { result } = renderHookWithQueryClient({
      groupVersionKind: { group: '', version: 'v1', kind: 'TestResource' },
      namespace: 'test-ns',
    });

    expect(result.current.data).toEqual([]);
    expect(result.current.clusterData).toEqual([]);
    expect(result.current.archiveData).toEqual([]);
  });

  it('should convert resourceInit to list format', () => {
    const resourceInit: WatchK8sResource = {
      groupVersionKind: { group: '', version: 'v1', kind: 'TestResource' },
      namespace: 'test-ns',
      name: 'specific-resource',
    };

    mockUseK8sWatchResource.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    } as any);

    mockUseKubearchiveListResourceQuery.mockReturnValue({
      data: { pages: [] },
      isLoading: false,
      error: null,
    } as any);

    renderHookWithQueryClient(resourceInit);

    // Verify that useK8sWatchResource was called with isList: true
    expect(mockUseK8sWatchResource).toHaveBeenCalledWith(
      expect.objectContaining({
        groupVersionKind: { group: '', version: 'v1', kind: 'TestResource' },
        namespace: 'test-ns',
        name: 'specific-resource',
        isList: true,
      }),
      mockModel,
      undefined,
      undefined,
    );
  });

  it('should handle archive data without pages property', () => {
    mockUseK8sWatchResource.mockReturnValue({
      data: [testResource1],
      isLoading: false,
      error: null,
    } as any);

    mockUseKubearchiveListResourceQuery.mockReturnValue({
      data: undefined, // No pages property
      isLoading: false,
      error: null,
    } as any);

    const { result } = renderHookWithQueryClient({
      groupVersionKind: { group: '', version: 'v1', kind: 'TestResource' },
      namespace: 'test-ns',
    });

    expect(result.current.data).toEqual([testResource1]); // Should only have cluster data
  });
});
