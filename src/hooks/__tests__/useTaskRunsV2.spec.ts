import * as React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { useIsOnFeatureFlag } from '~/feature-flags/hooks';
import { useKubearchiveListResourceQuery } from '~/kubearchive/hooks';
import { WatchK8sResource } from '~/types/k8s';
import { TaskRunKind } from '~/types/task-run';
import { createK8sWatchResourceMock, createTestQueryClient } from '~/utils/test-utils';
import { useTaskRunsV2 } from '../useTaskRunsV2';
import { useTRTaskRuns } from '../useTektonResults';

// Mock dependencies
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

const mockUseTRTaskRuns = useTRTaskRuns as jest.Mock;

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

// Sample TaskRun data
const mockTaskRun1: TaskRunKind = {
  apiVersion: 'tekton.dev/v1',
  kind: 'TaskRun',
  metadata: {
    name: 'task-run-1',
    namespace: 'default',
    uid: 'uid-1',
    creationTimestamp: '2024-01-02T00:00:00Z',
  },
  spec: {},
  status: {},
};

const mockTaskRun2: TaskRunKind = {
  apiVersion: 'tekton.dev/v1',
  kind: 'TaskRun',
  metadata: {
    name: 'task-run-2',
    namespace: 'default',
    uid: 'uid-2',
    creationTimestamp: '2024-01-01T00:00:00Z',
  },
  spec: {},
  status: {},
};

const mockTaskRun3: TaskRunKind = {
  apiVersion: 'tekton.dev/v1',
  kind: 'TaskRun',
  metadata: {
    name: 'task-run-3',
    namespace: 'default',
    uid: 'uid-3',
    creationTimestamp: '2024-01-03T00:00:00Z',
  },
  spec: {},
  status: {},
};

describe('useTaskRunsV2', () => {
  let queryClient: QueryClient;

  const renderHookWithQueryClient = (
    namespace: string,
    options?: Partial<Pick<WatchK8sResource, 'watch' | 'limit' | 'selector' | 'fieldSelector'>>,
  ) => {
    return renderHook(() => useTaskRunsV2(namespace, options), {
      wrapper: ({ children }) =>
        React.createElement(QueryClientProvider, { client: queryClient }, children),
    });
  };

  beforeEach(() => {
    queryClient = createTestQueryClient();
    jest.clearAllMocks();
    mockUseIsOnFeatureFlag.mockImplementation((flag: string) => {
      return flag === 'taskruns-kubearchive';
    });

    // Default mock for useK8sWatchResource hook
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

    // Default mock for useTRTaskRuns hook
    mockUseTRTaskRuns.mockImplementation((namespace) => [
      [],
      namespace !== null, // loaded = true only when namespace is provided
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
        data: [mockTaskRun1], // Live cluster data - only 1 item
        isLoading: false,
        error: null,
      });

      // Mock Tekton Results data (archive)
      mockUseTRTaskRuns.mockReturnValue([
        [mockTaskRun2, mockTaskRun3], // Archive data
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

      const [taskRuns, loaded, error, getNextPage, nextPageProps] = result.current;

      // Should have combined data (cluster + archive), deduplicated by name
      expect(taskRuns).toHaveLength(3);
      expect(taskRuns).toContain(mockTaskRun1); // from cluster
      expect(taskRuns).toContain(mockTaskRun2); // from archive
      expect(taskRuns).toContain(mockTaskRun3); // from archive

      expect(loaded).toBe(true);
      expect(error).toBeNull();
      expect(getNextPage).toBe(mockGetNextPage);
      expect(nextPageProps).toBe(mockNextPageProps);

      // Both cluster and Tekton Results should be called
      expect(mockUseK8sWatchResource).toHaveBeenCalled();
      expect(mockUseTRTaskRuns).toHaveBeenCalledWith('default', {
        selector: { matchLabels: { 'tekton.dev/pipelineRun': 'test-pr' } },
        limit: 5,
      });
    });

    it('should deduplicate between cluster and Tekton Results by name', async () => {
      // Create duplicate TaskRun with same name (cluster should win)
      const duplicateTaskRun: TaskRunKind = {
        ...mockTaskRun2,
        metadata: {
          ...mockTaskRun2.metadata,
          name: 'task-run-2', // Same name as mockTaskRun2
        },
      };

      // Mock cluster data with one duplicate
      mockUseK8sWatchResource.mockReturnValue({
        data: [mockTaskRun1, duplicateTaskRun], // Cluster version of task-run-2
        isLoading: false,
        error: null,
      });

      // Mock Tekton Results with original version
      mockUseTRTaskRuns.mockReturnValue([
        [mockTaskRun2, mockTaskRun3], // Archive has original task-run-2
        true,
        null,
        null,
        { hasNextPage: false, isFetchingNextPage: false },
      ]);

      const { result } = renderHookWithQueryClient('default');

      await waitFor(() => {
        expect(result.current[1]).toBe(true);
      });

      const [taskRuns] = result.current;

      // Should have 3 unique TaskRuns (deduplicated by name)
      expect(taskRuns).toHaveLength(3);

      // Cluster data should take precedence over archive data for duplicates
      const taskRun2Instance = taskRuns.find((tr) => tr.metadata.name === 'task-run-2');
      expect(taskRun2Instance).toBe(duplicateTaskRun); // Should be the cluster version

      // Should contain all unique TaskRuns
      const names = taskRuns.map((tr) => tr.metadata.name);
      expect(names).toContain('task-run-1');
      expect(names).toContain('task-run-2');
      expect(names).toContain('task-run-3');
    });

    it('should only query Tekton Results when needed (smart querying)', async () => {
      // Mock cluster data with enough items
      mockUseK8sWatchResource.mockReturnValue({
        data: [mockTaskRun1, mockTaskRun2, mockTaskRun3], // 3 items, limit is 2
        isLoading: false,
        error: null,
      });

      const { result } = renderHookWithQueryClient('default', { limit: 2 });

      await waitFor(() => {
        expect(result.current[1]).toBe(true);
      });

      // Tekton Results should NOT be called since cluster data satisfies the limit
      expect(mockUseTRTaskRuns).toHaveBeenCalledWith(null, expect.any(Object));

      const [taskRuns] = result.current;
      expect(taskRuns).toHaveLength(2); // Limited to 2 items
    });

    it('should handle Tekton Results errors gracefully', async () => {
      const mockError = new Error('Tekton Results error');

      // Mock cluster data with insufficient results to trigger needsMoreData
      mockUseK8sWatchResource.mockReturnValue({
        data: [mockTaskRun1], // Only 1 item
        isLoading: false,
        error: null,
      });

      // Mock Tekton Results error
      mockUseTRTaskRuns.mockReturnValue([
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

      const [taskRuns, loaded, error] = result.current;
      expect(taskRuns).toEqual([mockTaskRun1]); // Should still get cluster data
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
      mockUseTRTaskRuns.mockReturnValue([
        [mockTaskRun1, mockTaskRun2],
        true,
        null,
        null,
        { hasNextPage: false, isFetchingNextPage: false },
      ]);

      const { result } = renderHookWithQueryClient('default');

      await waitFor(() => {
        expect(result.current[1]).toBe(true); // loaded
      });

      const [taskRuns, loaded, error] = result.current;
      expect(taskRuns).toEqual([mockTaskRun1, mockTaskRun2]); // Should get archive data
      expect(loaded).toBe(true);
      expect(error).toBe(clusterError);
    });

    it('should support infinite loading with Tekton Results', async () => {
      const mockGetNextPage = jest.fn();
      const mockNextPageProps = { hasNextPage: true, isFetchingNextPage: false };

      mockUseTRTaskRuns.mockReturnValue([
        [mockTaskRun1, mockTaskRun2],
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
        data: [mockTaskRun1], // Live cluster data
        isLoading: false,
        error: null,
      });

      // Mock KubeArchive data (historical)
      const mockFetchNextPage = jest.fn();
      // @ts-expect-error - Mocking partial infinite query result for testing
      mockUseKubearchiveListResourceQuery.mockReturnValue({
        data: {
          pages: [[mockTaskRun2, mockTaskRun3]], // Historical archive data
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

      const [taskRuns, loaded, error, getNextPage, nextPageProps] = result.current;

      // Should have combined data (cluster + archive), sorted by creation timestamp (newest first)
      expect(taskRuns).toHaveLength(3);
      expect(taskRuns[0].metadata.name).toBe('task-run-3'); // newest (from archive)
      expect(taskRuns[1].metadata.name).toBe('task-run-1'); // middle (from cluster)
      expect(taskRuns[2].metadata.name).toBe('task-run-2'); // oldest (from archive)

      expect(loaded).toBe(true);
      expect(error).toBeNull();
      expect(getNextPage).toBe(mockFetchNextPage);
      expect(nextPageProps.hasNextPage).toBe(true);
      expect(nextPageProps.isFetchingNextPage).toBe(false);

      // Tekton Results should be called with null when KubeArchive is enabled
      expect(mockUseTRTaskRuns).toHaveBeenCalledWith(null, expect.any(Object));

      // Both cluster and archive sources should be called
      expect(mockUseK8sWatchResource).toHaveBeenCalled();
      expect(mockUseKubearchiveListResourceQuery).toHaveBeenCalled();
    });

    it('should deduplicate TaskRuns between cluster and archive data', async () => {
      // Create duplicate TaskRun with same UID (prioritize cluster data)
      const duplicateTaskRun: TaskRunKind = {
        ...mockTaskRun2,
        metadata: {
          ...mockTaskRun2.metadata,
          uid: 'uid-2', // Same UID as mockTaskRun2
        },
      };

      // Mock cluster data containing one of the duplicates
      mockUseK8sWatchResource.mockReturnValue({
        data: [mockTaskRun1, duplicateTaskRun], // Cluster has updated version
        isLoading: false,
        error: null,
      });

      // Mock archive data containing the other duplicate
      // @ts-expect-error - Mocking partial infinite query result for testing
      mockUseKubearchiveListResourceQuery.mockReturnValue({
        data: {
          pages: [[mockTaskRun2, mockTaskRun3]], // Archive has older version of same TaskRun
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

      const [taskRuns] = result.current;

      // Should have 3 unique TaskRuns (deduplicated by UID)
      expect(taskRuns).toHaveLength(3);

      // Cluster data should take precedence over archive data for duplicates
      const taskRun2Instance = taskRuns.find((tr) => tr.metadata.uid === 'uid-2');
      expect(taskRun2Instance).toBe(duplicateTaskRun); // Should be the cluster version

      // Should contain all unique TaskRuns
      const names = taskRuns.map((tr) => tr.metadata.name);
      expect(names).toContain('task-run-1');
      expect(names).toContain('task-run-2');
      expect(names).toContain('task-run-3');
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
          pages: [[mockTaskRun1]],
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

      const [taskRuns, loaded, error] = result.current;
      expect(taskRuns).toEqual([mockTaskRun1]); // Should still get archive data
      expect(loaded).toBe(true);
      expect(error).toBe(clusterError);
    });

    it('should handle archive errors gracefully', async () => {
      const archiveError = new Error('Archive error');

      // Mock successful cluster data
      mockUseK8sWatchResource.mockReturnValue({
        data: [mockTaskRun1],
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

      const [taskRuns, loaded, error] = result.current;
      expect(taskRuns).toEqual([mockTaskRun1]); // Should still get cluster data
      expect(loaded).toBe(true);
      expect(error).toBe(archiveError);
    });

    it('should support infinite loading with KubeArchive', async () => {
      const mockFetchNextPage = jest.fn();

      mockUseK8sWatchResource.mockReturnValue({
        data: [mockTaskRun1], // Some cluster data
        isLoading: false,
        error: null,
      });

      // @ts-expect-error - Mocking partial infinite query result for testing
      mockUseKubearchiveListResourceQuery.mockReturnValue({
        data: {
          pages: [[mockTaskRun2]],
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

      const [taskRuns, , , getNextPage, nextPageProps] = result.current;
      expect(taskRuns).toHaveLength(2); // Combined cluster + archive data
      expect(getNextPage).toBe(mockFetchNextPage);
      expect(nextPageProps.hasNextPage).toBe(true);
      expect(nextPageProps.isFetchingNextPage).toBe(false);
    });

    it('should apply limit correctly to combined data', async () => {
      mockUseK8sWatchResource.mockReturnValue({
        data: [mockTaskRun1], // 1 from cluster
        isLoading: false,
        error: null,
      });

      // @ts-expect-error - Mocking partial infinite query result for testing
      mockUseKubearchiveListResourceQuery.mockReturnValue({
        data: {
          pages: [[mockTaskRun2, mockTaskRun3]], // 2 from archive
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

      const [taskRuns] = result.current;
      expect(taskRuns).toHaveLength(2); // Limit applied to combined data
      // Should be newest 2 TaskRuns after sorting
      expect(taskRuns[0].metadata.name).toBe('task-run-3'); // newest
      expect(taskRuns[1].metadata.name).toBe('task-run-1'); // second newest
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
          pages: [[mockTaskRun1]],
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

      const [taskRuns, loaded, error] = result.current;
      expect(taskRuns).toEqual([]);
      expect(loaded).toBe(false);
      expect(error).toBeNull();

      expect(mockUseTRTaskRuns).toHaveBeenCalledWith(null, expect.any(Object));
    });
  });
});
