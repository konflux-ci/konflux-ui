/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-argument */

import * as React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { useK8sQueryWatch } from '../../k8s/hooks/useK8sQueryWatch';
import { K8sResourceReadOptions } from '../../k8s/k8s-fetch';
import { useKubearchiveListResourceQuery } from '../../kubearchive/hooks';
import { fetchResourceWithK8sAndKubeArchive } from '../../kubearchive/resource-utils';
import {
  K8sResourceCommon,
  K8sModelCommon,
  WatchK8sResource,
  ResourceSource,
} from '../../types/k8s';
import { createK8sWatchResourceMock, createTestQueryClient } from '../../utils/test-utils';
import { useK8sAndKarchResources, useK8sAndKarchResource } from '../useK8sAndKarchResources';

// Mock the kubearchive hooks and functions
jest.mock('../../kubearchive/hooks', () => ({
  useKubearchiveListResourceQuery: jest.fn(),
}));

jest.mock('../../kubearchive/resource-utils', () => ({
  fetchResourceWithK8sAndKubeArchive: jest.fn(),
}));

jest.mock('../../k8s/hooks/useK8sQueryWatch', () => ({
  useK8sQueryWatch: jest.fn(),
}));

const mockUseK8sWatchResource = createK8sWatchResourceMock();
const mockUseKubearchiveListResourceQuery = useKubearchiveListResourceQuery as jest.MockedFunction<
  typeof useKubearchiveListResourceQuery
>;
const mockFetchResourceWithK8sAndKubeArchive =
  fetchResourceWithK8sAndKubeArchive as jest.MockedFunction<
    typeof fetchResourceWithK8sAndKubeArchive
  >;
const mockUseK8sQueryWatch = useK8sQueryWatch as jest.MockedFunction<typeof useK8sQueryWatch>;

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

  const renderHookWithQueryClient = (
    resourceInit: WatchK8sResource | undefined,
    queryControl?: { enableCluster?: boolean; enableArchive?: boolean },
  ) => {
    return renderHook(
      () =>
        useK8sAndKarchResources<TestResource>(
          resourceInit,
          mockModel,
          undefined,
          undefined,
          queryControl,
        ),
      {
        wrapper: ({ children }) =>
          React.createElement(QueryClientProvider, { client: queryClient }, children),
      },
    );
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

    // Check that cluster resources have Cluster source via getSource
    const resource1 = result.current.data.find((r) => r.metadata.name === 'resource-1');
    const resource2 = result.current.data.find((r) => r.metadata.name === 'resource-2');
    const archiveRes = result.current.data.find((r) => r.metadata.name === 'archive-resource');

    expect(resource1).toBeDefined();
    expect(result.current.getSource(resource1)).toBe(ResourceSource.Cluster);
    expect(resource2).toBeDefined();
    expect(result.current.getSource(resource2)).toBe(ResourceSource.Cluster);
    expect(archiveRes).toBeDefined();
    expect(result.current.getSource(archiveRes)).toBe(ResourceSource.Archive);

    // Verify duplicateResource is not included
    expect(
      result.current.data.find((r) => r.metadata.name === 'resource-1-duplicate'),
    ).toBeUndefined();
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
    expect(result.current.data[0].metadata.name).toBe('resource-no-uid');
    expect(result.current.getSource(result.current.data[0])).toBe(ResourceSource.Cluster); // Cluster resource should take precedence
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
    expect(result.current.data).toHaveLength(1);
    expect(result.current.data[0].metadata.name).toBe('archive-resource');
    expect(result.current.getSource(result.current.data[0])).toBe(ResourceSource.Archive);
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

    const resource1 = result.current.data.find((r) => r.metadata.name === 'resource-1');
    const resource2 = result.current.data.find((r) => r.metadata.name === 'resource-2');
    const archiveRes = result.current.data.find((r) => r.metadata.name === 'archive-resource');

    expect(resource1).toBeDefined();
    expect(result.current.getSource(resource1)).toBe(ResourceSource.Cluster);
    expect(resource2).toBeDefined();
    expect(result.current.getSource(resource2)).toBe(ResourceSource.Archive);
    expect(archiveRes).toBeDefined();
    expect(result.current.getSource(archiveRes)).toBe(ResourceSource.Archive);
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
      { enabled: true },
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

    expect(result.current.data).toHaveLength(1);
    expect(result.current.data[0].metadata.name).toBe('resource-1');
    expect(result.current.getSource(result.current.data[0])).toBe(ResourceSource.Cluster);
  });

  it('should return correct source via getSource for resources', () => {
    mockUseK8sWatchResource.mockReturnValue({
      data: [testResource1, testResource2],
      isLoading: false,
      error: null,
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

    const resource1 = result.current.data.find((r) => r.metadata.name === 'resource-1');
    const resource2 = result.current.data.find((r) => r.metadata.name === 'resource-2');
    const archiveRes = result.current.data.find((r) => r.metadata.name === 'archive-resource');

    expect(result.current.getSource(resource1)).toBe(ResourceSource.Cluster);
    expect(result.current.getSource(resource2)).toBe(ResourceSource.Cluster);
    expect(result.current.getSource(archiveRes)).toBe(ResourceSource.Archive);
  });

  it('should exclude archive data when enableArchive is false', () => {
    mockUseK8sWatchResource.mockReturnValue({
      data: [testResource1, testResource2],
      isLoading: false,
      error: null,
    } as any);

    mockUseKubearchiveListResourceQuery.mockReturnValue({
      data: {
        pages: [[archiveResource]],
      },
      isLoading: false,
      error: null,
    } as any);

    const { result } = renderHookWithQueryClient(
      {
        groupVersionKind: { group: '', version: 'v1', kind: 'TestResource' },
        namespace: 'test-ns',
      },
      { enableArchive: false },
    );

    expect(result.current.data).toHaveLength(2);
    const resource1 = result.current.data.find((r) => r.metadata.name === 'resource-1');
    const resource2 = result.current.data.find((r) => r.metadata.name === 'resource-2');
    const archiveRes = result.current.data.find((r) => r.metadata.name === 'archive-resource');

    expect(resource1).toBeDefined();
    expect(result.current.getSource(resource1)).toBe(ResourceSource.Cluster);
    expect(resource2).toBeDefined();
    expect(result.current.getSource(resource2)).toBe(ResourceSource.Cluster);
    expect(archiveRes).toBeUndefined();
  });

  it('should exclude cluster data when enableCluster is false', () => {
    mockUseK8sWatchResource.mockReturnValue({
      data: [testResource1, testResource2],
      isLoading: false,
      error: null,
    } as any);

    mockUseKubearchiveListResourceQuery.mockReturnValue({
      data: {
        pages: [[archiveResource]],
      },
      isLoading: false,
      error: null,
    } as any);

    const { result } = renderHookWithQueryClient(
      {
        groupVersionKind: { group: '', version: 'v1', kind: 'TestResource' },
        namespace: 'test-ns',
      },
      { enableCluster: false },
    );

    expect(result.current.data).toHaveLength(1);
    const resource1 = result.current.data.find((r) => r.metadata.name === 'resource-1');
    const resource2 = result.current.data.find((r) => r.metadata.name === 'resource-2');
    const archiveRes = result.current.data.find((r) => r.metadata.name === 'archive-resource');

    expect(resource1).toBeUndefined();
    expect(resource2).toBeUndefined();
    expect(archiveRes).toBeDefined();
    expect(result.current.getSource(archiveRes)).toBe(ResourceSource.Archive);
  });

  it('should return empty array when both enableCluster and enableArchive are false', () => {
    mockUseK8sWatchResource.mockReturnValue({
      data: [testResource1, testResource2],
      isLoading: false,
      error: null,
    } as any);

    mockUseKubearchiveListResourceQuery.mockReturnValue({
      data: {
        pages: [[archiveResource]],
      },
      isLoading: false,
      error: null,
    } as any);

    const { result } = renderHookWithQueryClient(
      {
        groupVersionKind: { group: '', version: 'v1', kind: 'TestResource' },
        namespace: 'test-ns',
      },
      { enableCluster: false, enableArchive: false },
    );

    expect(result.current.data).toEqual([]);
  });

  it('should exclude cached archive data when enableArchive is false', () => {
    // First render with archive enabled to populate cache
    mockUseK8sWatchResource.mockReturnValue({
      data: [testResource1],
      isLoading: false,
      error: null,
    } as any);

    mockUseKubearchiveListResourceQuery.mockReturnValue({
      data: {
        pages: [[archiveResource]],
      },
      isLoading: false,
      error: null,
    } as any);

    const { result: result1 } = renderHookWithQueryClient({
      groupVersionKind: { group: '', version: 'v1', kind: 'TestResource' },
      namespace: 'test-ns',
    });

    const archiveRes1 = result1.current.data.find((r) => r.metadata.name === 'archive-resource');
    expect(archiveRes1).toBeDefined();
    expect(result1.current.getSource(archiveRes1)).toBe(ResourceSource.Archive);

    // Now disable archive - cached data should be excluded
    const { result: result2 } = renderHookWithQueryClient(
      {
        groupVersionKind: { group: '', version: 'v1', kind: 'TestResource' },
        namespace: 'test-ns',
      },
      { enableArchive: false },
    );

    expect(
      result2.current.data.find((r) => r.metadata.name === 'archive-resource'),
    ).toBeUndefined();
    const clusterRes2 = result2.current.data.find((r) => r.metadata.name === 'resource-1');
    expect(clusterRes2).toBeDefined();
    expect(result2.current.getSource(clusterRes2)).toBe(ResourceSource.Cluster);
  });

  it('should return undefined from getSource for an unknown resource', () => {
    mockUseK8sWatchResource.mockReturnValue({
      data: [testResource1],
      isLoading: false,
      error: null,
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

    const unknownResource: TestResource = {
      apiVersion: 'v1',
      kind: 'TestResource',
      metadata: {
        name: 'unknown-resource',
        namespace: 'test-ns',
        uid: 'uid-unknown',
      },
    };

    expect(result.current.getSource(unknownResource)).toBeUndefined();
  });

  it('should pass enabled: false to underlying hooks when resourceInit is undefined', () => {
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

    renderHookWithQueryClient(undefined);

    // Verify cluster query was called with enabled: false due to !!listResourceInit guard
    expect(mockUseK8sWatchResource).toHaveBeenCalledWith(
      undefined,
      mockModel,
      expect.objectContaining({ enabled: false }),
      undefined,
    );

    // Verify archive query was called with enabled: false due to !!listResourceInit guard
    expect(mockUseKubearchiveListResourceQuery).toHaveBeenCalledWith(
      undefined,
      mockModel,
      expect.objectContaining({ enabled: false }),
    );
  });

  it('should set source field on resources that have no UID (uses name-namespace)', () => {
    const resourceNoUid: TestResource = {
      apiVersion: 'v1',
      kind: 'TestResource',
      metadata: {
        name: 'resource-no-uid',
        namespace: 'test-ns',
      },
    };

    mockUseK8sWatchResource.mockReturnValue({
      data: [resourceNoUid],
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

    const foundResource = result.current.data.find((r) => r.metadata.name === 'resource-no-uid');
    expect(foundResource).toBeDefined();
    expect(result.current.getSource(foundResource)).toBe(ResourceSource.Cluster);
  });
});

describe('useK8sAndKarchResource', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    jest.clearAllMocks();
    mockUseK8sQueryWatch.mockReturnValue(undefined);
  });

  const mockResourceInit: K8sResourceReadOptions = {
    model: mockModel,
    queryOptions: {
      name: 'test-resource',
      ns: 'test-ns',
    },
  };

  const renderHookWithQueryClient = (
    resourceInit: K8sResourceReadOptions | null,
    queryOptions?: any,
    watch: boolean = false,
    watchOptions: any = {},
    enabled: boolean = true,
  ) => {
    return renderHook(
      () =>
        useK8sAndKarchResource<TestResource>(
          resourceInit,
          queryOptions,
          watch,
          watchOptions,
          enabled,
        ),
      {
        wrapper: ({ children }) =>
          React.createElement(QueryClientProvider, { client: queryClient }, children),
      },
    );
  };

  it('should fetch resource successfully from cluster', async () => {
    const mockResourceWithSource = {
      resource: testResource1,
      source: ResourceSource.Cluster,
    };

    mockFetchResourceWithK8sAndKubeArchive.mockResolvedValue(mockResourceWithSource);

    const { result } = renderHookWithQueryClient(mockResourceInit);

    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeUndefined();

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockFetchResourceWithK8sAndKubeArchive).toHaveBeenCalledWith(
      mockResourceInit,
      undefined,
    );
    expect(result.current.data).toBe(testResource1);
    expect(result.current.source).toBe(ResourceSource.Cluster);
    expect(result.current.fetchError).toBeNull();
    expect(result.current.isError).toBe(false);
  });

  it('should fetch resource from kubearchive when cluster returns 404', async () => {
    const mockResourceWithSource = {
      resource: testResource1,
      source: ResourceSource.Archive,
    };

    mockFetchResourceWithK8sAndKubeArchive.mockResolvedValue(mockResourceWithSource);

    const { result } = renderHookWithQueryClient(mockResourceInit);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toBe(testResource1);
    expect(result.current.source).toBe(ResourceSource.Archive);
  });

  it('should handle fetch errors correctly', async () => {
    const fetchError = new Error('Failed to fetch resource');
    mockFetchResourceWithK8sAndKubeArchive.mockRejectedValue(fetchError);

    const { result } = renderHookWithQueryClient(mockResourceInit);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toBeUndefined();
    expect(result.current.source).toBeUndefined();
    expect(result.current.fetchError).toBe(fetchError);
    expect(result.current.isError).toBe(true);
  });

  it('should enable watching when watch=true and source is cluster', async () => {
    const mockResourceWithSource = {
      resource: testResource1,
      source: ResourceSource.Cluster,
    };

    mockFetchResourceWithK8sAndKubeArchive.mockResolvedValue(mockResourceWithSource);

    const { result } = renderHookWithQueryClient(mockResourceInit, undefined, true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await waitFor(() => {
      expect(mockUseK8sQueryWatch).toHaveBeenCalledWith(
        mockResourceInit,
        false,
        expect.any(String), // hashed key
        {},
      );
    });
  });

  it('should not enable watching when watch=false', async () => {
    const mockResourceWithSource = {
      resource: testResource1,
      source: ResourceSource.Cluster,
    };

    mockFetchResourceWithK8sAndKubeArchive.mockResolvedValue(mockResourceWithSource);

    const { result } = renderHookWithQueryClient(mockResourceInit, undefined, false);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockUseK8sQueryWatch).toHaveBeenCalledWith(null, false, expect.any(String), {});
  });

  it('should not enable watching when source is kubearchive', async () => {
    const mockResourceWithSource = {
      resource: testResource1,
      source: ResourceSource.Archive,
    };

    mockFetchResourceWithK8sAndKubeArchive.mockResolvedValue(mockResourceWithSource);

    const { result } = renderHookWithQueryClient(mockResourceInit, undefined, true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockUseK8sQueryWatch).toHaveBeenCalledWith(null, false, expect.any(String), {});
  });

  it('should handle websocket errors correctly', async () => {
    const mockResourceWithSource = {
      resource: testResource1,
      source: ResourceSource.Cluster,
    };
    const wsError = { code: 1000, message: 'WebSocket connection failed' };

    mockFetchResourceWithK8sAndKubeArchive.mockResolvedValue(mockResourceWithSource);
    mockUseK8sQueryWatch.mockReturnValue(wsError);

    const { result } = renderHookWithQueryClient(mockResourceInit, undefined, true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.wsError).toBe(wsError);
    expect(result.current.isError).toBe(true);
    expect(result.current.data).toBe(testResource1); // data should still be available
  });

  it('should not fetch when enabled=false', () => {
    const { result } = renderHookWithQueryClient(mockResourceInit, undefined, false, {}, false);

    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toBeUndefined();
    expect(mockFetchResourceWithK8sAndKubeArchive).not.toHaveBeenCalled();
  });

  it('should not fetch when resourceInit is null', () => {
    const { result } = renderHookWithQueryClient(null);

    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toBeUndefined();
    expect(mockFetchResourceWithK8sAndKubeArchive).not.toHaveBeenCalled();
  });

  it('should pass query options to fetch function', async () => {
    const queryOptions = { timeout: 5000 };
    const mockResourceWithSource = {
      resource: testResource1,
      source: ResourceSource.Cluster,
    };

    mockFetchResourceWithK8sAndKubeArchive.mockResolvedValue(mockResourceWithSource);

    const { result } = renderHookWithQueryClient(mockResourceInit, queryOptions);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockFetchResourceWithK8sAndKubeArchive).toHaveBeenCalledWith(
      mockResourceInit,
      queryOptions,
    );
  });

  it('should pass watch options to useK8sQueryWatch', async () => {
    const watchOptions = { wsPrefix: 'custom-prefix', timeout: 1000 };
    const mockResourceWithSource = {
      resource: testResource1,
      source: ResourceSource.Cluster,
    };

    mockFetchResourceWithK8sAndKubeArchive.mockResolvedValue(mockResourceWithSource);

    const { result } = renderHookWithQueryClient(mockResourceInit, undefined, true, watchOptions);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockUseK8sQueryWatch).toHaveBeenCalledWith(
      mockResourceInit,
      false,
      expect.any(String),
      watchOptions,
    );
  });
});
