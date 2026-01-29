import * as React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { useIsOnFeatureFlag } from '~/feature-flags/hooks';
import { HttpError } from '~/k8s/error';
import {
  useKubearchiveGetResourceQuery,
  useKubearchiveListResourceQuery,
} from '~/kubearchive/hooks';
import { WatchK8sResource } from '~/types/k8s';
import { TaskRunKind } from '~/types/task-run';
import {
  createUseApplicationMock,
  createK8sWatchResourceMock,
  createTestQueryClient,
} from '~/utils/test-utils';
import { TaskRunGroupVersionKind, TaskRunModel } from '../../models';
import { useTaskRunV2, useTaskRunsV2, useTaskRunsForPipelineRuns } from '../useTaskRunsV2';
import { useTRTaskRuns } from '../useTektonResults';

jest.mock('../useTektonResults');
jest.mock('../../kubearchive/hooks');
jest.mock('../../feature-flags/hooks');

createUseApplicationMock([{ metadata: { name: 'test' } }, true]);

const useTRTaskRunsMock = useTRTaskRuns as jest.Mock;
const useKubearchiveGetResourceQueryMock = useKubearchiveGetResourceQuery as jest.Mock;
const useIsOnFeatureFlagMock = useIsOnFeatureFlag as jest.Mock;
const useK8sWatchResourceMock = createK8sWatchResourceMock();

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
    useK8sWatchResourceMock.mockReturnValue({
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
      useK8sWatchResourceMock.mockReturnValue({
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
      expect(useK8sWatchResourceMock).toHaveBeenCalled();
      expect(mockUseTRTaskRuns).toHaveBeenCalledWith(
        'default',
        {
          selector: { matchLabels: { 'tekton.dev/pipelineRun': 'test-pr' } },
          limit: 5,
        },
        { enabled: true },
      );
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
      useK8sWatchResourceMock.mockReturnValue({
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
      useK8sWatchResourceMock.mockReturnValue({
        data: [mockTaskRun1, mockTaskRun2, mockTaskRun3], // 3 items, limit is 2
        isLoading: false,
        error: null,
      });

      const { result } = renderHookWithQueryClient('default', { limit: 2 });

      await waitFor(() => {
        expect(result.current[1]).toBe(true);
      });

      // Tekton Results should NOT be called since cluster data satisfies the limit
      expect(mockUseTRTaskRuns).toHaveBeenCalledWith(null, expect.any(Object), { enabled: false });

      const [taskRuns] = result.current;
      expect(taskRuns).toHaveLength(2); // Limited to 2 items
    });

    it('should handle Tekton Results errors gracefully', async () => {
      const mockError = new Error('Tekton Results error');

      // Mock cluster data with insufficient results to trigger needsMoreData
      useK8sWatchResourceMock.mockReturnValue({
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
      useK8sWatchResourceMock.mockReturnValue({
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
      useK8sWatchResourceMock.mockReturnValue({
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
      expect(mockUseTRTaskRuns).toHaveBeenCalledWith(null, expect.any(Object), { enabled: false });

      // Both cluster and archive sources should be called
      expect(useK8sWatchResourceMock).toHaveBeenCalled();
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
      useK8sWatchResourceMock.mockReturnValue({
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
      useK8sWatchResourceMock.mockReturnValue({
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
      useK8sWatchResourceMock.mockReturnValue({
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

      useK8sWatchResourceMock.mockReturnValue({
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
      useK8sWatchResourceMock.mockReturnValue({
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
      useK8sWatchResourceMock.mockReturnValue({
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

      expect(mockUseTRTaskRuns).toHaveBeenCalledWith(null, expect.any(Object), { enabled: '' });
    });
  });

  describe('etcdRunsRef logic - preserve removed runs', () => {
    beforeEach(() => {
      mockUseIsOnFeatureFlag.mockReturnValue(false);
    });

    it('should include removed TaskRuns from etcd in results', async () => {
      // start with initial TaskRuns
      useK8sWatchResourceMock.mockReturnValue({
        data: [mockTaskRun2, mockTaskRun3], // 2 items initially
        isLoading: false,
        error: null,
      });

      mockUseTRTaskRuns.mockReturnValue([
        [],
        true,
        null,
        null,
        { hasNextPage: false, isFetchingNextPage: false },
        jest.fn(),
      ]);

      const { result, rerender } = renderHookWithQueryClient('default');

      await waitFor(() => {
        expect(result.current[1]).toBe(true);
      });

      // should have initial 2 TaskRuns
      expect(result.current[0]).toHaveLength(2);
      expect(result.current[0]).toContainEqual(mockTaskRun2);
      expect(result.current[0]).toContainEqual(mockTaskRun3);

      // update to different TaskRuns (mockTaskRun2 and mockTaskRun3 are removed, mockTaskRun1 is added)
      useK8sWatchResourceMock.mockReturnValue({
        data: [mockTaskRun1],
        isLoading: false,
        error: null,
      });

      rerender();

      await waitFor(() => {
        expect(result.current[1]).toBe(true);
      });

      // should include both new TaskRun and previously removed ones
      const [taskRuns] = result.current;
      expect(taskRuns).toHaveLength(3); // mockTaskRun1 + removed mockTaskRun2 + removed mockTaskRun3
      expect(taskRuns).toContainEqual(mockTaskRun1);
      expect(taskRuns).toContainEqual(mockTaskRun2);
      expect(taskRuns).toContainEqual(mockTaskRun3);

      // update to empty array (all TaskRuns removed from etcd)
      useK8sWatchResourceMock.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      });

      rerender();

      await waitFor(() => {
        expect(result.current[1]).toBe(true);
      });

      // should still include all previously seen TaskRuns
      const [finalTaskRuns] = result.current;
      expect(finalTaskRuns).toHaveLength(3); // all 3 TaskRuns preserved
      expect(finalTaskRuns).toContainEqual(mockTaskRun1);
      expect(finalTaskRuns).toContainEqual(mockTaskRun2);
      expect(finalTaskRuns).toContainEqual(mockTaskRun3);
    });

    it('should deduplicate by uid when preserving removed runs', async () => {
      // create a TaskRun with same uid but different name (should be deduplicated)
      const taskRunWithSameUid: TaskRunKind = {
        ...mockTaskRun1,
        metadata: {
          ...mockTaskRun1.metadata,
          name: 'task-run-1-renamed', // different name, same uid
        },
      };

      // start with initial TaskRun
      useK8sWatchResourceMock.mockReturnValue({
        data: [mockTaskRun1],
        isLoading: false,
        error: null,
      });

      mockUseTRTaskRuns.mockReturnValue([
        [],
        true,
        null,
        null,
        { hasNextPage: false, isFetchingNextPage: false },
        jest.fn(),
      ]);

      const { result, rerender } = renderHookWithQueryClient('default');

      await waitFor(() => {
        expect(result.current[1]).toBe(true);
      });

      // update with TaskRun that has same uid but different name
      useK8sWatchResourceMock.mockReturnValue({
        data: [taskRunWithSameUid], // same uid, different name
        isLoading: false,
        error: null,
      });

      rerender();

      await waitFor(() => {
        expect(result.current[1]).toBe(true);
      });

      // should have only 1 TaskRun (deduplicated by uid), and it should be the new one
      const [taskRuns] = result.current;
      expect(taskRuns).toHaveLength(1);
      expect(taskRuns[0].metadata.name).toBe('task-run-1-renamed'); // should be the updated version
      expect(taskRuns[0].metadata.uid).toBe('uid-1');
    });
  });

  describe('useTaskRunsForPipelineRuns', () => {
    beforeEach(() => {
      mockUseIsOnFeatureFlag.mockReturnValue(false); // Default to Tekton Results for this test
    });

    it('should call useTaskRunsV2 with correct selector including taskName when provided', async () => {
      // Mock the underlying useTaskRunsV2 to return sorted data
      const mockTaskRuns = [mockTaskRun1, mockTaskRun2];

      useK8sWatchResourceMock.mockReturnValue({
        data: mockTaskRuns,
        isLoading: false,
        error: null,
      });

      mockUseTRTaskRuns.mockReturnValue([
        [],
        true,
        null,
        null,
        { hasNextPage: false, isFetchingNextPage: false },
      ]);

      const { result } = renderHook(
        () => useTaskRunsForPipelineRuns('test-ns', 'test-pipelinerun', 'test-task'),
        {
          wrapper: ({ children }) =>
            React.createElement(QueryClientProvider, { client: queryClient }, children),
        },
      );

      await waitFor(() => {
        expect(result.current[1]).toBe(true); // loaded
      });

      const [taskRuns, loaded, error] = result.current;
      expect(taskRuns).toBeDefined();
      expect(loaded).toBe(true);
      expect(error).toBeNull();

      expect(useK8sWatchResourceMock).toHaveBeenCalledWith(
        expect.objectContaining({
          selector: {
            matchLabels: {
              'tekton.dev/pipelineRun': 'test-pipelinerun',
              'tekton.dev/pipelineTask': 'test-task',
            },
          },
        }),
        expect.any(Object),
        expect.any(Object),
      );
    });

    it('should call useTaskRunsV2 with selector without taskName when not provided', async () => {
      useK8sWatchResourceMock.mockReturnValue({
        data: [mockTaskRun1],
        isLoading: false,
        error: null,
      });

      mockUseTRTaskRuns.mockReturnValue([
        [],
        true,
        null,
        null,
        { hasNextPage: false, isFetchingNextPage: false },
      ]);

      const { result } = renderHook(
        () => useTaskRunsForPipelineRuns('test-ns', 'test-pipelinerun'),
        {
          wrapper: ({ children }) =>
            React.createElement(QueryClientProvider, { client: queryClient }, children),
        },
      );

      await waitFor(() => {
        expect(result.current[1]).toBe(true); // loaded
      });

      expect(useK8sWatchResourceMock).toHaveBeenCalledWith(
        expect.objectContaining({
          selector: {
            matchLabels: {
              'tekton.dev/pipelineRun': 'test-pipelinerun',
            },
          },
        }),
        expect.any(Object),
        expect.any(Object),
      );

      // Verify that pipelineTask label is NOT in the selector when taskName is undefined
      const callArgs = useK8sWatchResourceMock.mock.calls[0][0];
      expect(callArgs.selector.matchLabels).not.toHaveProperty('tekton.dev/pipelineTask');
    });
  });
});

describe('useTaskRunV2', () => {
  const mockTaskRun = {
    kind: TaskRunGroupVersionKind.kind,
    metadata: {
      name: 'test-taskrun',
      namespace: 'test-ns',
      uid: 'test-uid',
    },
    spec: {},
    status: {},
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('when kubearchive feature flag is enabled', () => {
    beforeEach(() => {
      useIsOnFeatureFlagMock.mockImplementation((flag: string) => flag === 'taskruns-kubearchive');
    });

    it('should call hooks with correct parameters', () => {
      useK8sWatchResourceMock.mockReturnValue({ data: undefined, isLoading: true, error: null });
      useKubearchiveGetResourceQueryMock.mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: false,
        error: null,
      });
      useTRTaskRunsMock.mockReturnValue([[], false, undefined]);

      renderHook(() => useTaskRunV2('test-ns', 'test-taskrun'));

      expect(useK8sWatchResourceMock).toHaveBeenCalledWith(
        {
          groupVersionKind: TaskRunGroupVersionKind,
          namespace: 'test-ns',
          name: 'test-taskrun',
          watch: true,
        },
        TaskRunModel,
        { retry: false },
      );
      expect(useKubearchiveGetResourceQueryMock).toHaveBeenCalledWith(
        {
          groupVersionKind: TaskRunGroupVersionKind,
          namespace: 'test-ns',
          name: 'test-taskrun',
        },
        TaskRunModel,
        expect.objectContaining({
          enabled: undefined,
        }),
      );
      expect(useTRTaskRunsMock).toHaveBeenCalledWith(
        null,
        {
          name: 'test-taskrun',
          limit: 1,
          filter: 'data.metadata.name == "test-taskrun"',
        },
        expect.objectContaining({ staleTime: Infinity }),
      );
    });

    it('should return data from k8s when available', () => {
      useK8sWatchResourceMock.mockReturnValue({ data: mockTaskRun, isLoading: false, error: null });
      useKubearchiveGetResourceQueryMock.mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: false,
        error: null,
      });
      useTRTaskRunsMock.mockReturnValue([[], true, undefined]);

      const { result } = renderHook(() => useTaskRunV2('test-ns', 'test-taskrun'));

      expect(result.current).toEqual([mockTaskRun, true, null]);
    });

    it('should return loading state when k8s is loading', () => {
      useK8sWatchResourceMock.mockReturnValue({ data: undefined, isLoading: true, error: null });
      useKubearchiveGetResourceQueryMock.mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: false,
        error: null,
      });
      useTRTaskRunsMock.mockReturnValue([[], true, undefined]);

      const { result } = renderHook(() => useTaskRunV2('test-ns', 'test-taskrun'));

      expect(result.current).toEqual([undefined, false, null]);
    });

    it('should return data from kubearchive when k8s has no data', () => {
      useK8sWatchResourceMock.mockReturnValue({ data: undefined, isLoading: false, error: null });
      useKubearchiveGetResourceQueryMock.mockReturnValue({
        data: mockTaskRun,
        isLoading: false,
        isError: false,
        error: null,
      });
      useTRTaskRunsMock.mockReturnValue([[], true, undefined]);

      const { result } = renderHook(() => useTaskRunV2('test-ns', 'test-taskrun'));

      expect(result.current).toEqual([mockTaskRun, true, null]);
    });

    it('should return loading state when kubearchive is loading', () => {
      useK8sWatchResourceMock.mockReturnValue({ data: undefined, isLoading: false, error: null });
      useKubearchiveGetResourceQueryMock.mockReturnValue({
        data: undefined,
        isLoading: true,
        isError: false,
        error: null,
      });
      useTRTaskRunsMock.mockReturnValue([[], true, undefined]);

      const { result } = renderHook(() => useTaskRunV2('test-ns', 'test-taskrun'));

      expect(result.current).toEqual([undefined, false, null]);
    });

    it('should return error when both k8s and kubearchive fail', () => {
      const error = { code: 404, message: 'Not found' };
      useK8sWatchResourceMock.mockReturnValue({ data: undefined, isLoading: false, error });
      useKubearchiveGetResourceQueryMock.mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: true,
        error,
      });
      useTRTaskRunsMock.mockReturnValue([[], true, undefined]);

      const { result } = renderHook(() => useTaskRunV2('test-ns', 'test-taskrun'));

      expect(result.current).toEqual([undefined, true, error]);
    });
  });

  describe('when kubearchive feature flag is disabled', () => {
    beforeEach(() => {
      useIsOnFeatureFlagMock.mockImplementation(() => false);
    });

    it('should call hooks with correct parameters when kubearchive is disabled', () => {
      useK8sWatchResourceMock.mockReturnValue({ data: undefined, isLoading: true, error: null });
      useKubearchiveGetResourceQueryMock.mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: false,
        error: null,
      });
      useTRTaskRunsMock.mockReturnValue([[], false, undefined]);

      renderHook(() => useTaskRunV2('test-ns', 'test-taskrun'));

      expect(useK8sWatchResourceMock).toHaveBeenCalledWith(
        {
          groupVersionKind: TaskRunGroupVersionKind,
          namespace: 'test-ns',
          name: 'test-taskrun',
          watch: true,
        },
        TaskRunModel,
        { retry: false },
      );
      expect(useKubearchiveGetResourceQueryMock).toHaveBeenCalledWith(
        {
          groupVersionKind: TaskRunGroupVersionKind,
          namespace: 'test-ns',
          name: 'test-taskrun',
        },
        TaskRunModel,
        expect.objectContaining({
          enabled: false,
        }),
      );
      expect(useTRTaskRunsMock).toHaveBeenCalledWith(
        null,
        {
          name: 'test-taskrun',
          limit: 1,
          filter: 'data.metadata.name == "test-taskrun"',
        },
        expect.objectContaining({ staleTime: Infinity }),
      );
    });

    it('should return data from k8s when available and kubearchive disabled', () => {
      useK8sWatchResourceMock.mockReturnValue({ data: mockTaskRun, isLoading: false, error: null });
      useKubearchiveGetResourceQueryMock.mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: false,
        error: null,
      });
      useTRTaskRunsMock.mockReturnValue([[], true, undefined]);

      const { result } = renderHook(() => useTaskRunV2('test-ns', 'test-taskrun'));

      expect(result.current).toEqual([mockTaskRun, true, null]);
    });

    it('should return data from tekton results when k8s has no data and kubearchive disabled', () => {
      useK8sWatchResourceMock.mockReturnValue({ data: undefined, isLoading: false, error: null });
      useKubearchiveGetResourceQueryMock.mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: false,
        error: null,
      });
      useTRTaskRunsMock.mockReturnValue([[mockTaskRun], true, undefined]);

      const { result } = renderHook(() => useTaskRunV2('test-ns', 'test-taskrun'));

      expect(result.current).toEqual([mockTaskRun, true, undefined]);
    });

    it('should return loading state when tekton results is loading', () => {
      useK8sWatchResourceMock.mockReturnValue({ data: undefined, isLoading: false, error: null });
      useKubearchiveGetResourceQueryMock.mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: false,
        error: null,
      });
      useTRTaskRunsMock.mockReturnValue([[], false, undefined]);

      const { result } = renderHook(() => useTaskRunV2('test-ns', 'test-taskrun'));

      expect(result.current).toEqual([undefined, false, null]);
    });

    it('should return error when k8s and tekton results both fail', () => {
      const error = { code: 500, message: 'Server error' };
      useK8sWatchResourceMock.mockReturnValue({ data: undefined, isLoading: false, error });
      useKubearchiveGetResourceQueryMock.mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: false,
        error: null,
      });
      useTRTaskRunsMock.mockReturnValue([[], true, error]);

      const { result } = renderHook(() => useTaskRunV2('test-ns', 'test-taskrun'));

      expect(result.current).toEqual([undefined, true, error]);
    });
  });

  it('should handle parameter changes correctly', () => {
    useIsOnFeatureFlagMock.mockImplementation((flag: string) => flag === 'taskruns-kubearchive');
    useK8sWatchResourceMock.mockReturnValue({ data: undefined, isLoading: true, error: null });
    useKubearchiveGetResourceQueryMock.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
      error: null,
    });
    useTRTaskRunsMock.mockReturnValue([[], false, undefined]);

    const { rerender } = renderHook(
      ({ namespace, taskRunName }) => useTaskRunV2(namespace, taskRunName),
      {
        initialProps: { namespace: 'test-ns', taskRunName: 'test-taskrun' },
      },
    );

    rerender({ namespace: 'new-ns', taskRunName: 'new-taskrun' });

    expect(useK8sWatchResourceMock).toHaveBeenLastCalledWith(
      {
        groupVersionKind: TaskRunGroupVersionKind,
        namespace: 'new-ns',
        name: 'new-taskrun',
        watch: true,
      },
      TaskRunModel,
      { retry: false },
    );
  });

  describe('404 error handling', () => {
    beforeEach(() => {
      useIsOnFeatureFlagMock.mockReturnValue(false);
      useKubearchiveGetResourceQueryMock.mockReturnValue({
        data: null,
        isLoading: false,
        error: null,
      });
    });

    it('should only enable tekton query when cluster returns 404 error', () => {
      const error404 = HttpError.fromCode(404);

      // cluster returns 404
      useK8sWatchResourceMock.mockReturnValue({
        data: null,
        isLoading: false,
        error: error404,
        isError: true,
      });

      useTRTaskRunsMock.mockReturnValue([
        [mockTaskRun],
        true,
        null,
        null,
        { hasNextPage: false, isFetchingNextPage: false },
        jest.fn(),
      ]);

      renderHook(() => useTaskRunV2('test-ns', 'test-taskrun'));

      // should call tekton with namespace (enabled because of 404)
      expect(useTRTaskRunsMock).toHaveBeenCalledWith(
        'test-ns',
        expect.objectContaining({
          name: 'test-taskrun',
          limit: 1,
        }),
        expect.any(Object),
      );
    });

    it('should return cluster data when available and no 404 error', () => {
      useK8sWatchResourceMock.mockReturnValue({
        data: mockTaskRun,
        isLoading: false,
        error: null,
      });

      useTRTaskRunsMock.mockReturnValue([
        [mockTaskRun],
        true,
        null,
        null,
        { hasNextPage: false, isFetchingNextPage: false },
        jest.fn(),
      ]);

      const { result } = renderHook(() => useTaskRunV2('test-ns', 'test-taskrun'));

      // should return cluster data even if tekton/kubearchive have data
      expect(result.current[0]).toBe(mockTaskRun);
    });

    it('should enable kubearchive query when cluster returns 404 error and kubearchive is enabled', () => {
      const error404 = HttpError.fromCode(404);
      useIsOnFeatureFlagMock.mockReturnValue(true);

      // cluster returns 404
      useK8sWatchResourceMock.mockReturnValue({
        data: null,
        isLoading: false,
        error: error404,
        isError: true,
      });

      useKubearchiveGetResourceQueryMock.mockReturnValue({
        data: mockTaskRun,
        isLoading: false,
        error: null,
      });

      useTRTaskRunsMock.mockReturnValue([
        [],
        true,
        null,
        null,
        { hasNextPage: false, isFetchingNextPage: false },
        jest.fn(),
      ]);

      renderHook(() => useTaskRunV2('test-ns', 'test-taskrun'));

      // should enable kubearchive query when 404 error
      expect(useKubearchiveGetResourceQueryMock).toHaveBeenCalledWith(
        expect.objectContaining({
          groupVersionKind: TaskRunGroupVersionKind,
          namespace: 'test-ns',
          name: 'test-taskrun',
        }),
        TaskRunModel,
        expect.objectContaining({ enabled: true }),
      );
    });
  });
});
