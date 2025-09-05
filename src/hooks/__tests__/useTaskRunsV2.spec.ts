import * as React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { useIsOnFeatureFlag } from '~/feature-flags/hooks';
import { useKubearchiveListResourceQuery } from '~/kubearchive/hooks';
import { TaskRunKind } from '~/types/task-run';
import { createK8sWatchResourceMock, createTestQueryClient } from '~/utils/test-utils';
import { useTaskRunsV2, TaskRunsV2Options } from '../useTaskRunsV2';
import { useTRTaskRuns } from '../useTektonResults';

// Mock dependencies
jest.mock('../useTektonResults');
jest.mock('~/kubearchive/hooks');

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

  const renderHookWithQueryClient = (namespace: string, options?: TaskRunsV2Options) => {
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

    it('should fetch data from Tekton Results', async () => {
      const mockGetNextPage = jest.fn();
      const mockNextPageProps = { hasNextPage: true, isFetchingNextPage: false };

      mockUseTRTaskRuns.mockReturnValue([
        [mockTaskRun1, mockTaskRun2],
        true,
        null,
        mockGetNextPage,
        mockNextPageProps,
      ]);

      const { result } = renderHookWithQueryClient('default', {
        selector: { matchLabels: { 'tekton.dev/pipelineRun': 'test-pr' } },
      });

      await waitFor(() => {
        expect(result.current[1]).toBe(true); // loaded
      });

      const [taskRuns, loaded, error, getNextPage, nextPageProps] = result.current;

      expect(taskRuns).toEqual([mockTaskRun1, mockTaskRun2]);
      expect(loaded).toBe(true);
      expect(error).toBeNull();
      expect(getNextPage).toBe(mockGetNextPage);
      expect(nextPageProps).toBe(mockNextPageProps);

      expect(mockUseTRTaskRuns).toHaveBeenCalledWith('default', {
        selector: { matchLabels: { 'tekton.dev/pipelineRun': 'test-pr' } },
        limit: undefined,
      });
    });

    it('should handle Tekton Results errors', async () => {
      const mockError = new Error('Tekton Results error');
      mockUseTRTaskRuns.mockReturnValue([
        [],
        true,
        mockError,
        null,
        { hasNextPage: false, isFetchingNextPage: false },
      ]);

      const { result } = renderHookWithQueryClient('default');

      await waitFor(() => {
        expect(result.current[1]).toBe(true); // loaded
      });

      const [taskRuns, loaded, error] = result.current;
      expect(taskRuns).toEqual([]);
      expect(loaded).toBe(true);
      expect(error).toBe(mockError);
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

    it('should fetch data from KubeArchive only', async () => {
      // Mock KubeArchive data
      const mockFetchNextPage = jest.fn();
      // @ts-expect-error - Mocking partial infinite query result for testing
      mockUseKubearchiveListResourceQuery.mockReturnValue({
        data: {
          pages: [[mockTaskRun2, mockTaskRun3]],
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

      // Should have KubeArchive data only, sorted by creation timestamp (newest first)
      expect(taskRuns).toHaveLength(2);
      expect(taskRuns[0].metadata.name).toBe('task-run-3'); // newest
      expect(taskRuns[1].metadata.name).toBe('task-run-2'); // oldest

      expect(loaded).toBe(true);
      expect(error).toBeNull();
      expect(getNextPage).toBe(mockFetchNextPage);
      expect(nextPageProps.hasNextPage).toBe(true);
      expect(nextPageProps.isFetchingNextPage).toBe(false);

      // Tekton Results should be called with null when KubeArchive is enabled (hooks called unconditionally)
      expect(mockUseTRTaskRuns).toHaveBeenCalledWith(null, expect.any(Object));
    });

    it('should handle KubeArchive errors gracefully', async () => {
      const archiveError = new Error('Archive error');

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
      expect(taskRuns).toEqual([]);
      expect(loaded).toBe(true);
      expect(error).toBe(archiveError);
    });

    it('should support infinite loading with KubeArchive', async () => {
      const mockFetchNextPage = jest.fn();

      mockUseK8sWatchResource.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      });

      // @ts-expect-error - Mocking partial infinite query result for testing
      mockUseKubearchiveListResourceQuery.mockReturnValue({
        data: {
          pages: [[mockTaskRun1]],
          pageParams: [],
        },
        isLoading: false,
        error: null,
        hasNextPage: true,
        isFetchingNextPage: false,
        fetchNextPage: mockFetchNextPage,
      });

      const { result } = renderHook(() => useTaskRunsV2('default'));

      await waitFor(() => {
        expect(result.current[1]).toBe(true);
      });

      const [, , , getNextPage, nextPageProps] = result.current;
      expect(getNextPage).toBe(mockFetchNextPage);
      expect(nextPageProps.hasNextPage).toBe(true);
      expect(nextPageProps.isFetchingNextPage).toBe(false);
    });

    it('should apply limit correctly', async () => {
      mockUseK8sWatchResource.mockReturnValue({
        data: [mockTaskRun1],
        isLoading: false,
        error: null,
      });

      // @ts-expect-error - Mocking partial infinite query result for testing
      mockUseKubearchiveListResourceQuery.mockReturnValue({
        data: {
          pages: [[mockTaskRun2, mockTaskRun3]],
          pageParams: [],
        },
        isLoading: false,
        error: null,
        hasNextPage: false,
        isFetchingNextPage: false,
        fetchNextPage: undefined,
      });

      const { result } = renderHook(() => useTaskRunsV2('default', { limit: 2 }));

      await waitFor(() => {
        expect(result.current[1]).toBe(true);
      });

      const [taskRuns] = result.current;
      expect(taskRuns).toHaveLength(2); // Both taskruns because limit applies after sorting
    });
  });

  describe('when disabled', () => {
    it('should not fetch data when enabled is false', () => {
      mockUseIsOnFeatureFlag.mockReturnValue(false);

      const { result } = renderHookWithQueryClient('default', { enabled: false });

      const [taskRuns, loaded, error] = result.current;
      expect(taskRuns).toEqual([]);
      expect(loaded).toBe(false);
      expect(error).toBeNull();

      expect(mockUseTRTaskRuns).toHaveBeenCalledWith(null, expect.any(Object));
    });

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
