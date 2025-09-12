import * as React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { useIsOnFeatureFlag } from '~/feature-flags/hooks';
import { useKubearchiveListResourceQuery } from '~/kubearchive/hooks';
import { PipelineRunKind } from '~/types';
import { WatchK8sResource } from '~/types/k8s';
import { createK8sWatchResourceMock, createTestQueryClient } from '~/utils/test-utils';
import { usePipelineRunsV2 } from '../usePipelineRunsV2';
import { useTRPipelineRuns } from '../useTektonResults';

jest.mock('../useTektonResults');
jest.mock('~/kubearchive/hooks');
jest.mock(
  '~/kubearchive/conditional-checks',
  () => ({
    createConditionsHook: jest.fn(),
  }),
  { virtual: true },
);

const mockUseIsOnFeatureFlag = useIsOnFeatureFlag as jest.Mock;
const mockUseK8sWatchResource = createK8sWatchResourceMock();
const mockUseKubearchiveListResourceQuery = useKubearchiveListResourceQuery as jest.MockedFunction<
  typeof useKubearchiveListResourceQuery
>;

const mockUseTRPipelineRuns = useTRPipelineRuns as jest.Mock;

jest.mock('~/feature-flags/hooks', () => {
  const mockFn = jest.fn();
  return {
    useIsOnFeatureFlag: mockFn,
    IfFeature: ({ flag, children }: { flag: string; children: React.ReactNode }) => {
      const isEnabled = mockFn(flag);
      return isEnabled ? children : null;
    },
  };
});

const mockPipelineRun: PipelineRunKind[] = [
  {
    apiVersion: 'tekton.dev/v1',
    kind: 'PipelineRun',
    metadata: {
      name: 'pipeline-run-1',
      namespace: 'default',
      uid: 'uid-1',
      creationTimestamp: '2024-01-02T00:00:00Z',
    },
    spec: {},
  },
  {
    apiVersion: 'tekton.dev/v1',
    kind: 'PipelineRun',
    metadata: {
      name: 'pipeline-run-2',
      namespace: 'default',
      uid: 'uid-2',
      creationTimestamp: '2024-01-01T00:00:00Z',
    },
    spec: {},
  },
  {
    apiVersion: 'tekton.dev/v1',
    kind: 'PipelineRun',
    metadata: {
      name: 'pipeline-run-3',
      namespace: 'default',
      uid: 'uid-3',
      creationTimestamp: '2024-01-03T00:00:00Z',
    },
    spec: {},
  },
];

describe('usePipelineRunsV2', () => {
  let queryClient: QueryClient;

  const renderHookWithQueryClient = (
    namespace: string,
    options?: Partial<Pick<WatchK8sResource, 'watch' | 'limit' | 'selector' | 'fieldSelector'>>,
  ) => {
    return renderHook(() => usePipelineRunsV2(namespace, options), {
      wrapper: ({ children }) =>
        React.createElement(QueryClientProvider, { client: queryClient }, children),
    });
  };

  beforeEach(() => {
    queryClient = createTestQueryClient();
    jest.clearAllMocks();
    mockUseIsOnFeatureFlag.mockImplementation((flag: string) => {
      return flag === 'pipelineruns-kubearchive';
    });

    mockUseK8sWatchResource.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    });

    // Default mock for useKubearchiveListResourceQuery hook
    // @ts-expect-error - Mocking partial infinite query result for testing
    mockUseKubearchiveListResourceQuery.mockReturnValue({
      data: {
        pages: [],
        pageParams: [],
      },
      isLoading: false,
      error: null,
      hasNextPage: false,
      isFetchingNextPage: false,
      fetchNextPage: jest.fn(),
    });

    mockUseTRPipelineRuns.mockImplementation((namespace) => [
      [],
      namespace !== null,
      null,
      null,
      { hasNextPage: false, isFetchingNextPage: false },
    ]);
  });

  describe('when using Tekton Results (feature flag disabled)', () => {
    beforeEach(() => {
      mockUseIsOnFeatureFlag.mockReturnValue(false);
    });

    it('should combine cluster and Tekton Results data', async () => {
      const mockGetNextPage = jest.fn();
      const mockNextPageProps = { hasNextPage: true, isFetchingNextPage: false };

      // Mock cluster data (live) - not enough to satisfy limit
      mockUseK8sWatchResource.mockReturnValue({
        data: [mockPipelineRun[0]], // Live cluster data - only 1 item
        isLoading: false,
        error: null,
      });

      // Mock Tekton Results data (archive)
      mockUseTRPipelineRuns.mockReturnValue([
        [mockPipelineRun[1], mockPipelineRun[2]], // Archive data
        true,
        null,
        mockGetNextPage,
        mockNextPageProps,
      ]);

      const { result } = renderHookWithQueryClient('default', {
        selector: { matchLabels: { 'tekton.dev/pipelineRun': 'test-pr' } },
        limit: 5, // Set limit higher than cluster data to trigger needsMoreData
      });

      await waitFor(() => {
        expect(result.current[1]).toBe(true); // loaded
      });

      const [pipelineRuns, loaded, error, getNextPage, nextPageProps] = result.current;

      // Should have combined data (cluster + archive), deduplicated by name
      expect(pipelineRuns).toHaveLength(3);
      expect(pipelineRuns).toContain(mockPipelineRun[0]); // from cluster
      expect(pipelineRuns).toContain(mockPipelineRun[1]); // from archive
      expect(pipelineRuns).toContain(mockPipelineRun[2]); // from archive

      expect(loaded).toBe(true);
      expect(error).toBeNull();
      expect(getNextPage).toBe(mockGetNextPage);
      expect(nextPageProps).toBe(mockNextPageProps);

      // Both cluster and Tekton Results should be called
      expect(mockUseK8sWatchResource).toHaveBeenCalled();
      expect(mockUseTRPipelineRuns).toHaveBeenCalledWith('default', {
        selector: { matchLabels: { 'tekton.dev/pipelineRun': 'test-pr' } },
        limit: 5,
      });
    });

    it('should deduplicate between cluster and Tekton Results by name', async () => {
      // Create duplicate PipelineRun with same name (cluster should win)
      const duplicatePipelineRun: PipelineRunKind = {
        ...mockPipelineRun[1],
        metadata: {
          ...mockPipelineRun[1].metadata,
          name: 'pipeline-run-2', // Same name as mockPipelineRun[1]
        },
      };

      // Mock cluster data with one duplicate
      mockUseK8sWatchResource.mockReturnValue({
        data: [mockPipelineRun[0], duplicatePipelineRun], // Cluster version of pipeline-run-2
        isLoading: false,
        error: null,
      });

      // Mock Tekton Results with original version
      mockUseTRPipelineRuns.mockReturnValue([
        [mockPipelineRun[1], mockPipelineRun[2]], // Archive has original pipeline-run-2
        true,
        null,
        null,
        { hasNextPage: false, isFetchingNextPage: false },
      ]);

      const { result } = renderHookWithQueryClient('default');

      await waitFor(() => {
        expect(result.current[1]).toBe(true);
      });

      const [pipelineRuns] = result.current;

      // Should have 3 unique PipelineRuns (deduplicated by name)
      expect(pipelineRuns).toHaveLength(3);

      // Cluster data should take precedence over archive data for duplicates
      const pipelineRun2Instance = pipelineRuns.find((tr) => tr.metadata.name === 'pipeline-run-2');
      expect(pipelineRun2Instance).toBe(duplicatePipelineRun); // Should be the cluster version

      // Should contain all unique PipelineRuns
      const names = pipelineRuns.map((tr) => tr.metadata.name);
      expect(names).toContain('pipeline-run-1');
      expect(names).toContain('pipeline-run-2');
      expect(names).toContain('pipeline-run-3');
    });

    it('should only query Tekton Results when needed (smart querying)', async () => {
      // Mock cluster data with enough items
      mockUseK8sWatchResource.mockReturnValue({
        data: [mockPipelineRun[0], mockPipelineRun[1], mockPipelineRun[2]], // 3 items, limit is 2
        isLoading: false,
        error: null,
      });

      const { result } = renderHookWithQueryClient('default', { limit: 2 });

      await waitFor(() => {
        expect(result.current[1]).toBe(true);
      });

      // Tekton Results should NOT be called since cluster data satisfies the limit
      expect(mockUseTRPipelineRuns).toHaveBeenCalledWith(null, expect.any(Object));

      const [pipelineRuns] = result.current;
      expect(pipelineRuns).toHaveLength(2); // Limited to 2 items
    });

    it('should handle Tekton Results errors gracefully', async () => {
      const mockError = new Error('Tekton Results error');

      // Mock cluster data with insufficient results to trigger needsMoreData
      mockUseK8sWatchResource.mockReturnValue({
        data: [mockPipelineRun[0]], // Only 1 item
        isLoading: false,
        error: null,
      });

      // Mock Tekton Results error
      mockUseTRPipelineRuns.mockReturnValue([
        [],
        true,
        mockError,
        null,
        { hasNextPage: false, isFetchingNextPage: false },
      ]);

      const { result } = renderHookWithQueryClient('default', {
        limit: 5, // Set limit higher than cluster data to trigger Tekton Results query
      });

      await waitFor(() => {
        expect(result.current[1]).toBe(true); // loaded
      });

      const [pipelineRuns, loaded, error] = result.current;
      expect(pipelineRuns).toEqual([mockPipelineRun[0]]); // Should still get cluster data
      expect(loaded).toBe(true);
      expect(error).toBe(mockError);
    });

    it('should handle cluster errors gracefully', async () => {
      const clusterError = new Error('Cluster error');

      // Mock cluster error (should trigger Tekton Results query)
      mockUseK8sWatchResource.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: clusterError,
      });

      // Mock successful Tekton Results
      mockUseTRPipelineRuns.mockReturnValue([
        [mockPipelineRun[0], mockPipelineRun[1]],
        true,
        null,
        null,
        { hasNextPage: false, isFetchingNextPage: false },
      ]);

      const { result } = renderHookWithQueryClient('default');

      await waitFor(() => {
        expect(result.current[1]).toBe(true); // loaded
      });

      const [pipelineRuns, loaded, error] = result.current;
      expect(pipelineRuns).toEqual([mockPipelineRun[0], mockPipelineRun[1]]); // Should get archive data
      expect(loaded).toBe(true);
      expect(error).toBe(clusterError);
    });

    it('should support infinite loading with Tekton Results', async () => {
      const mockGetNextPage = jest.fn();
      const mockNextPageProps = { hasNextPage: true, isFetchingNextPage: false };

      mockUseTRPipelineRuns.mockReturnValue([
        [mockPipelineRun[0], mockPipelineRun[1]],
        true,
        null,
        mockGetNextPage,
        mockNextPageProps,
      ]);

      const { result } = renderHookWithQueryClient('default');

      await waitFor(() => {
        expect(result.current[1]).toBe(true);
      });

      const [, , , getNextPage, nextPageProps] = result.current;
      expect(getNextPage).toBe(mockGetNextPage);
      expect(nextPageProps.hasNextPage).toBe(true);
      expect(nextPageProps.isFetchingNextPage).toBe(false);
    });
  });

  describe('when using KubeArchive (feature flag enabled)', () => {
    beforeEach(() => {
      mockUseIsOnFeatureFlag.mockReturnValue(true);
    });

    it('should combine cluster and archive data from KubeArchive', async () => {
      // Mock cluster data (live)
      mockUseK8sWatchResource.mockReturnValue({
        data: [mockPipelineRun[0]], // Live cluster data
        isLoading: false,
        error: null,
      });

      // Mock KubeArchive data (historical)
      const mockFetchNextPage = jest.fn();
      // @ts-expect-error - Mocking partial infinite query result for testing
      mockUseKubearchiveListResourceQuery.mockReturnValue({
        data: {
          pages: [[mockPipelineRun[1], mockPipelineRun[2]]], // Historical archive data
          pageParams: [],
        },
        isLoading: false,
        error: null,
        hasNextPage: true,
        isFetchingNextPage: false,
        fetchNextPage: mockFetchNextPage,
      });

      const { result } = renderHookWithQueryClient('default', {
        selector: { matchLabels: { 'tekton.dev/pipelineRun': 'test-pr' } },
      });

      await waitFor(() => {
        expect(result.current[1]).toBe(true); // loaded
      });

      const [pipelineRuns, loaded, error, getNextPage, nextPageProps] = result.current;

      // Should have combined data (cluster + archive), sorted by creation timestamp (newest first)
      expect(pipelineRuns).toHaveLength(3);
      expect(pipelineRuns[0].metadata.name).toBe('pipeline-run-3'); // newest (from archive)
      expect(pipelineRuns[1].metadata.name).toBe('pipeline-run-1'); // middle (from cluster)
      expect(pipelineRuns[2].metadata.name).toBe('pipeline-run-2'); // oldest (from archive)

      expect(loaded).toBe(true);
      expect(error).toBeNull();
      expect(typeof getNextPage).toBe('function');
      expect(nextPageProps.hasNextPage).toBe(true);
      expect(nextPageProps.isFetchingNextPage).toBe(false);

      // Test that getNextPage calls the underlying function
      getNextPage();
      expect(mockFetchNextPage).toHaveBeenCalled();

      // Tekton Results should be called with null when KubeArchive is enabled
      expect(mockUseTRPipelineRuns).toHaveBeenCalledWith(null, expect.any(Object));

      // Both cluster and archive sources should be called
      expect(mockUseK8sWatchResource).toHaveBeenCalled();
      expect(mockUseKubearchiveListResourceQuery).toHaveBeenCalled();
    });

    it('should deduplicate PipelineRuns between cluster and archive data', async () => {
      // Create duplicate PipelineRun with same UID (prioritize cluster data)
      const duplicatePipelineRun: PipelineRunKind = {
        ...mockPipelineRun[1],
        metadata: {
          ...mockPipelineRun[1].metadata,
          uid: 'uid-2', // Same UID as mockPipelineRun[1]
        },
      };

      // Mock cluster data containing one of the duplicates
      mockUseK8sWatchResource.mockReturnValue({
        data: [mockPipelineRun[0], duplicatePipelineRun], // Cluster has updated version
        isLoading: false,
        error: null,
      });

      // Mock archive data containing the other duplicate
      // @ts-expect-error - Mocking partial infinite query result for testing
      mockUseKubearchiveListResourceQuery.mockReturnValue({
        data: {
          pages: [[mockPipelineRun[1], mockPipelineRun[2]]], // Archive has older version of same PipelinRun
          pageParams: [],
        },
        isLoading: false,
        error: null,
        hasNextPage: false,
        isFetchingNextPage: false,
        fetchNextPage: undefined,
      });

      const { result } = renderHookWithQueryClient('default');

      await waitFor(() => {
        expect(result.current[1]).toBe(true);
      });

      const [pipelineRuns] = result.current;

      // Should have 3 unique PipelineRuns (deduplicated by UID)
      expect(pipelineRuns).toHaveLength(3);

      // Cluster data should take precedence over archive data for duplicates
      const pipelineRun2Instance = pipelineRuns.find((tr) => tr.metadata.uid === 'uid-2');
      expect(pipelineRun2Instance).toBe(duplicatePipelineRun); // Should be the cluster version

      // Should contain all unique PipelineRuns
      const names = pipelineRuns.map((tr) => tr.metadata.name);
      expect(names).toContain('pipeline-run-1');
      expect(names).toContain('pipeline-run-2');
      expect(names).toContain('pipeline-run-3');
    });

    it('should handle cluster errors gracefully', async () => {
      const clusterError = new Error('Cluster error');

      // Mock cluster error
      mockUseK8sWatchResource.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: clusterError,
      });

      // Mock successful archive data
      // @ts-expect-error - Mocking partial infinite query result for testing
      mockUseKubearchiveListResourceQuery.mockReturnValue({
        data: {
          pages: [[mockPipelineRun[0]]],
          pageParams: [],
        },
        isLoading: false,
        error: null,
        hasNextPage: false,
        isFetchingNextPage: false,
        fetchNextPage: undefined,
      });

      const { result } = renderHookWithQueryClient('default');

      await waitFor(() => {
        expect(result.current[1]).toBe(true);
      });

      const [pipelineRuns, loaded, error] = result.current;
      expect(pipelineRuns).toEqual([mockPipelineRun[0]]); // Should still get archive data
      expect(loaded).toBe(true);
      expect(error).toBe(clusterError);
    });

    it('should handle archive errors gracefully', async () => {
      const archiveError = new Error('Archive error');

      // Mock successful cluster data
      mockUseK8sWatchResource.mockReturnValue({
        data: [mockPipelineRun[0]],
        isLoading: false,
        error: null,
      });

      // Mock archive error
      // @ts-expect-error - Mocking partial infinite query result for testing
      mockUseKubearchiveListResourceQuery.mockReturnValue({
        data: null,
        isLoading: false,
        error: archiveError,
        hasNextPage: false,
        isFetchingNextPage: false,
        fetchNextPage: undefined,
      });

      const { result } = renderHookWithQueryClient('default');

      await waitFor(() => {
        expect(result.current[1]).toBe(true);
      });

      const [pipelineRuns, loaded, error] = result.current;
      expect(pipelineRuns).toEqual([mockPipelineRun[0]]); // Should still get cluster data
      expect(loaded).toBe(true);
      expect(error).toBe(archiveError);
    });

    it('should support infinite loading with KubeArchive', async () => {
      const mockFetchNextPage = jest.fn();

      mockUseK8sWatchResource.mockReturnValue({
        data: [mockPipelineRun[0]], // Some cluster data
        isLoading: false,
        error: null,
      });

      // @ts-expect-error - Mocking partial infinite query result for testing
      mockUseKubearchiveListResourceQuery.mockReturnValue({
        data: {
          pages: [[mockPipelineRun[1]]],
          pageParams: [],
        },
        isLoading: false,
        error: null,
        hasNextPage: true,
        isFetchingNextPage: false,
        fetchNextPage: mockFetchNextPage,
      });

      const { result } = renderHookWithQueryClient('default');

      await waitFor(() => {
        expect(result.current[1]).toBe(true);
      });

      const [pipelineRuns, , , getNextPage, nextPageProps] = result.current;
      expect(pipelineRuns).toHaveLength(2); // Combined cluster + archive data
      expect(typeof getNextPage).toBe('function');
      expect(nextPageProps.hasNextPage).toBe(true);
      expect(nextPageProps.isFetchingNextPage).toBe(false);

      // Test that getNextPage calls the underlying function
      getNextPage();
      expect(mockFetchNextPage).toHaveBeenCalled();
    });

    it('should apply limit correctly to combined data', async () => {
      mockUseK8sWatchResource.mockReturnValue({
        data: [mockPipelineRun[0]],
        isLoading: false,
        error: null,
      });

      // @ts-expect-error - Mocking partial infinite query result for testing
      mockUseKubearchiveListResourceQuery.mockReturnValue({
        data: {
          pages: [[mockPipelineRun[1], mockPipelineRun[2]]], // 2 from archive
          pageParams: [],
        },
        isLoading: false,
        error: null,
        hasNextPage: false,
        isFetchingNextPage: false,
        fetchNextPage: undefined,
      });

      const { result } = renderHookWithQueryClient('default', { limit: 2 });

      await waitFor(() => {
        expect(result.current[1]).toBe(true);
      });

      const [pipelineRuns] = result.current;
      expect(pipelineRuns).toHaveLength(2); // Limit applied to combined data
      // Should be newest 2 PipelineRuns after sorting
      expect(pipelineRuns[0].metadata.name).toBe('pipeline-run-3'); // newest
      expect(pipelineRuns[1].metadata.name).toBe('pipeline-run-1'); // second newest
    });

    it('should handle loading states for both cluster and archive', () => {
      // Mock cluster loading
      mockUseK8sWatchResource.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      });

      // Mock archive loaded
      // @ts-expect-error - Mocking partial infinite query result for testing
      mockUseKubearchiveListResourceQuery.mockReturnValue({
        data: {
          pages: [[mockPipelineRun[0]]],
          pageParams: [],
        },
        isLoading: false,
        error: null,
        hasNextPage: false,
        isFetchingNextPage: false,
        fetchNextPage: undefined,
      });

      const { result } = renderHookWithQueryClient('default');

      // Should be loading when either source is loading
      expect(result.current[1]).toBe(false); // not loaded
    });
  });

  describe('when disabled', () => {
    it('should not fetch data when namespace is empty', () => {
      mockUseIsOnFeatureFlag.mockReturnValue(false);

      const { result } = renderHookWithQueryClient('');

      const [pipelineRuns, loaded, error] = result.current;
      expect(pipelineRuns).toEqual([]);
      expect(loaded).toBe(false);
      expect(error).toBeNull();

      expect(mockUseTRPipelineRuns).toHaveBeenCalledWith(null, undefined);
    });
  });
});
