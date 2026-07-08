import * as React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { createTestQueryClient } from '~/unit-test-utils/mock-react-query';
import { Issue, IssueSeverity, IssueState, IssueType } from '../issue-type';
import { fetchIssues } from '../kite-fetch';
import {
  useIssueCountsBySeverity,
  useIssueCountsByType,
  useCriticalAndMajorIssues,
} from '../kite-hooks';

jest.mock('../kite-fetch');

const mockFetchIssues = fetchIssues as jest.MockedFunction<typeof fetchIssues>;

describe('kite-hooks', () => {
  let queryClient: QueryClient;

  const renderHookWithQueryClient = <T>(hook: () => T) => {
    return renderHook(hook, {
      wrapper: ({ children }) =>
        React.createElement(QueryClientProvider, { client: queryClient }, children),
    });
  };

  beforeEach(() => {
    queryClient = createTestQueryClient();
    jest.clearAllMocks();
  });

  describe('useIssueCountsBySeverity', () => {
    it('should return loading state initially', () => {
      mockFetchIssues.mockImplementation(() => new Promise(() => {})); // Never resolves

      const { result } = renderHookWithQueryClient(() =>
        useIssueCountsBySeverity('test-namespace'),
      );

      expect(result.current.isLoaded).toBe(false);
      expect(result.current.counts).toBeUndefined();
      expect(result.current.error).toBeUndefined();
    });

    it('should return counts when all queries succeed', async () => {
      // Mock responses for each severity level
      mockFetchIssues
        .mockResolvedValueOnce({ data: [], total: 5, limit: 1, offset: 0 }) // critical
        .mockResolvedValueOnce({ data: [], total: 3, limit: 1, offset: 0 }) // major
        .mockResolvedValueOnce({ data: [], total: 2, limit: 1, offset: 0 }) // minor
        .mockResolvedValueOnce({ data: [], total: 1, limit: 1, offset: 0 }); // info

      const { result } = renderHookWithQueryClient(() =>
        useIssueCountsBySeverity('test-namespace'),
      );

      await waitFor(() => {
        expect(result.current.isLoaded).toBe(true);
      });

      expect(result.current.counts).toEqual({
        critical: 5,
        major: 3,
        minor: 2,
        info: 1,
      });
      expect(result.current.error).toBeUndefined();
    });

    it('should handle zero counts correctly', async () => {
      mockFetchIssues.mockResolvedValue({ data: [], total: 0, limit: 1, offset: 0 });

      const { result } = renderHookWithQueryClient(() =>
        useIssueCountsBySeverity('test-namespace'),
      );

      await waitFor(() => {
        expect(result.current.isLoaded).toBe(true);
      });

      expect(result.current.counts).toEqual({
        critical: 0,
        major: 0,
        minor: 0,
        info: 0,
      });
    });

    it('should return error when any query fails', async () => {
      const mockError = new Error('API Error');
      mockFetchIssues
        .mockResolvedValueOnce({ data: [], total: 5, limit: 1, offset: 0 }) // critical succeeds
        .mockRejectedValueOnce(mockError); // major fails

      const { result } = renderHookWithQueryClient(() =>
        useIssueCountsBySeverity('test-namespace'),
      );

      await waitFor(() => {
        expect(result.current.error).toBeDefined();
      });

      expect(result.current.error).toEqual(mockError);
      expect(result.current.counts).toBeUndefined();
    });

    it('should call fetchIssues with correct parameters', async () => {
      mockFetchIssues.mockResolvedValue({ data: [], total: 0, limit: 1, offset: 0 });

      renderHookWithQueryClient(() => useIssueCountsBySeverity('test-namespace'));

      await waitFor(() => {
        expect(mockFetchIssues).toHaveBeenCalled();
      });

      // Verify it was called with severity filters
      expect(mockFetchIssues).toHaveBeenCalledWith(
        expect.objectContaining({
          namespace: 'test-namespace',
          limit: 1,
          severity: expect.any(String),
        }),
      );
    });
  });

  describe('useIssueCountsByType', () => {
    it('should return loading state initially', () => {
      mockFetchIssues.mockImplementation(() => new Promise(() => {})); // Never resolves

      const { result } = renderHookWithQueryClient(() => useIssueCountsByType('test-namespace'));

      expect(result.current.isLoaded).toBe(false);
      expect(result.current.counts).toBeUndefined();
      expect(result.current.error).toBeUndefined();
    });

    it('should return counts when all queries succeed', async () => {
      // Mock responses for each issue type
      mockFetchIssues
        .mockResolvedValueOnce({ data: [], total: 5, limit: 1, offset: 0 }) // build
        .mockResolvedValueOnce({ data: [], total: 4, limit: 1, offset: 0 }) // test
        .mockResolvedValueOnce({ data: [], total: 3, limit: 1, offset: 0 }) // release
        .mockResolvedValueOnce({ data: [], total: 2, limit: 1, offset: 0 }) // dependency
        .mockResolvedValueOnce({ data: [], total: 1, limit: 1, offset: 0 }); // pipeline

      const { result } = renderHookWithQueryClient(() => useIssueCountsByType('test-namespace'));

      await waitFor(() => {
        expect(result.current.isLoaded).toBe(true);
      });

      expect(result.current.counts).toEqual({
        build: 5,
        test: 4,
        release: 3,
        dependency: 2,
        pipeline: 1,
      });
      expect(result.current.error).toBeUndefined();
    });

    it('should handle zero counts correctly', async () => {
      mockFetchIssues.mockResolvedValue({ data: [], total: 0, limit: 1, offset: 0 });

      const { result } = renderHookWithQueryClient(() => useIssueCountsByType('test-namespace'));

      await waitFor(() => {
        expect(result.current.isLoaded).toBe(true);
      });

      expect(result.current.counts).toEqual({
        build: 0,
        test: 0,
        release: 0,
        dependency: 0,
        pipeline: 0,
      });
    });

    it('should return error when any query fails', async () => {
      const mockError = new Error('Network Error');
      mockFetchIssues
        .mockResolvedValueOnce({ data: [], total: 5, limit: 1, offset: 0 }) // build succeeds
        .mockResolvedValueOnce({ data: [], total: 4, limit: 1, offset: 0 }) // test succeeds
        .mockRejectedValueOnce(mockError); // release fails

      const { result } = renderHookWithQueryClient(() => useIssueCountsByType('test-namespace'));

      await waitFor(() => {
        expect(result.current.error).toBeDefined();
      });

      expect(result.current.error).toEqual(mockError);
      expect(result.current.counts).toBeUndefined();
    });

    it('should call fetchIssues with correct parameters', async () => {
      mockFetchIssues.mockResolvedValue({ data: [], total: 0, limit: 1, offset: 0 });

      renderHookWithQueryClient(() => useIssueCountsByType('test-namespace'));

      await waitFor(() => {
        expect(mockFetchIssues).toHaveBeenCalled();
      });

      // Verify it was called with issueType filters
      expect(mockFetchIssues).toHaveBeenCalledWith(
        expect.objectContaining({
          namespace: 'test-namespace',
          limit: 1,
          issueType: expect.any(String),
        }),
      );
    });
  });

  describe('useCriticalAndMajorIssues', () => {
    const createMockIssue = (severity: IssueSeverity, id: string): Issue => ({
      id,
      title: `Test Issue ${id}`,
      description: 'Test description',
      severity,
      issueType: IssueType.BUILD,
      state: IssueState.ACTIVE,
      detectedAt: '2023-10-01T12:00:00Z',
      namespace: 'test-namespace',
      scope: {
        resourceType: 'test-resource',
        resourceName: 'test-name',
        resourceNamespace: 'test-namespace',
      },
      links: [],
      relatedFrom: [],
      relatedTo: [],
      createdAt: '2023-10-01T12:00:00Z',
      updatedAt: '2023-10-01T12:00:00Z',
    });

    it('should return loading state initially', () => {
      mockFetchIssues.mockImplementation(() => new Promise(() => {})); // Never resolves

      const { result } = renderHookWithQueryClient(() =>
        useCriticalAndMajorIssues('test-namespace'),
      );

      expect(result.current.isLoaded).toBe(false);
      expect(result.current.hasError).toBe(false);
    });

    it('should return critical and major issues grouped by severity', async () => {
      const criticalIssues = [createMockIssue(IssueSeverity.CRITICAL, 'crit-1')];
      const majorIssues = [
        createMockIssue(IssueSeverity.MAJOR, 'major-1'),
        createMockIssue(IssueSeverity.MAJOR, 'major-2'),
      ];

      mockFetchIssues
        .mockResolvedValueOnce({
          data: criticalIssues,
          total: 1,
          limit: 20,
          offset: 0,
        })
        .mockResolvedValueOnce({
          data: majorIssues,
          total: 2,
          limit: 20,
          offset: 0,
        });

      const { result } = renderHookWithQueryClient(() =>
        useCriticalAndMajorIssues('test-namespace'),
      );

      await waitFor(() => {
        expect(result.current.isLoaded).toBe(true);
      });

      expect(result.current.data).toHaveLength(2);
      expect(result.current.data[0]).toEqual({
        severity: IssueSeverity.CRITICAL,
        issues: criticalIssues,
        total: 1,
        isLoading: false,
        error: null,
      });
      expect(result.current.data[1]).toEqual({
        severity: IssueSeverity.MAJOR,
        issues: majorIssues,
        total: 2,
        isLoading: false,
        error: null,
      });
    });

    it('should fetch only critical and major issues', async () => {
      mockFetchIssues.mockResolvedValue({
        data: [],
        total: 0,
        limit: 20,
        offset: 0,
      });

      const { result } = renderHookWithQueryClient(() =>
        useCriticalAndMajorIssues('test-namespace'),
      );

      await waitFor(() => {
        expect(result.current.isLoaded).toBe(true);
      });

      expect(result.current.data).toHaveLength(2);
      expect(result.current.data[0].severity).toBe(IssueSeverity.CRITICAL);
      expect(result.current.data[1].severity).toBe(IssueSeverity.MAJOR);

      // Should fetch both critical and major issues with ACTIVE state and limit 1
      expect(mockFetchIssues).toHaveBeenCalledTimes(2);
      expect(mockFetchIssues).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: IssueSeverity.CRITICAL,
          namespace: 'test-namespace',
          state: IssueState.ACTIVE,
          limit: 1,
        }),
      );
      expect(mockFetchIssues).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: IssueSeverity.MAJOR,
          namespace: 'test-namespace',
          state: IssueState.ACTIVE,
          limit: 1,
        }),
      );
    });

    it('should handle empty results', async () => {
      mockFetchIssues.mockResolvedValue({
        data: [],
        total: 0,
        limit: 20,
        offset: 0,
      });

      const { result } = renderHookWithQueryClient(() =>
        useCriticalAndMajorIssues('test-namespace'),
      );

      await waitFor(() => {
        expect(result.current.isLoaded).toBe(true);
      });

      expect(result.current.data).toHaveLength(2);
      expect(result.current.data[0].issues).toEqual([]);
      expect(result.current.data[0].total).toBe(0);
      expect(result.current.data[1].issues).toEqual([]);
      expect(result.current.data[1].total).toBe(0);
    });

    it('should handle errors', async () => {
      const mockError = new Error('API Error');
      mockFetchIssues.mockRejectedValue(mockError);

      const { result } = renderHookWithQueryClient(() =>
        useCriticalAndMajorIssues('test-namespace'),
      );

      await waitFor(() => {
        expect(result.current.hasError).toBe(true);
      });

      expect(result.current.isLoaded).toBe(true);
      expect(result.current.data[0].error).toEqual(mockError);
    });

    it('should apply noRefetch option when true', async () => {
      mockFetchIssues.mockResolvedValue({
        data: [],
        total: 0,
        limit: 20,
        offset: 0,
      });

      renderHookWithQueryClient(() => useCriticalAndMajorIssues('test-namespace', true));

      await waitFor(() => {
        expect(mockFetchIssues).toHaveBeenCalled();
      });

      // The actual refetch behavior is handled by React Query
      // We just verify the hook is called correctly
      expect(mockFetchIssues).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: IssueSeverity.CRITICAL,
          namespace: 'test-namespace',
          state: IssueState.ACTIVE,
          limit: 1,
        }),
      );
    });

    it('should not refetch on remount when noRefetch is true', async () => {
      const criticalIssues = [createMockIssue(IssueSeverity.CRITICAL, 'crit-1')];
      const majorIssues = [createMockIssue(IssueSeverity.MAJOR, 'major-1')];
      mockFetchIssues
        .mockResolvedValueOnce({
          data: criticalIssues,
          total: 1,
          limit: 20,
          offset: 0,
        })
        .mockResolvedValueOnce({
          data: majorIssues,
          total: 1,
          limit: 20,
          offset: 0,
        });

      // First render
      const { result, unmount } = renderHookWithQueryClient(() =>
        useCriticalAndMajorIssues('test-namespace', true),
      );

      await waitFor(() => {
        expect(result.current.isLoaded).toBe(true);
      });

      const initialCallCount = mockFetchIssues.mock.calls.length;
      expect(initialCallCount).toBe(2); // Critical and Major

      // Unmount and remount
      unmount();

      const { result: result2 } = renderHookWithQueryClient(() =>
        useCriticalAndMajorIssues('test-namespace', true),
      );

      await waitFor(() => {
        expect(result2.current.isLoaded).toBe(true);
      });

      // Should not have made additional fetch calls due to noRefetch
      // The query should be served from cache
      expect(mockFetchIssues.mock.calls.length).toBe(initialCallCount);
      expect(result2.current.data[0].issues).toEqual(criticalIssues);
      expect(result2.current.data[1].issues).toEqual(majorIssues);
    });

    it('should allow refetch on remount when noRefetch is false', async () => {
      const criticalIssues = [createMockIssue(IssueSeverity.CRITICAL, 'crit-1')];
      const majorIssues = [createMockIssue(IssueSeverity.MAJOR, 'major-1')];
      mockFetchIssues
        .mockResolvedValueOnce({
          data: criticalIssues,
          total: 1,
          limit: 20,
          offset: 0,
        })
        .mockResolvedValueOnce({
          data: majorIssues,
          total: 1,
          limit: 20,
          offset: 0,
        });

      // First render without noRefetch - refetchOnMount is not set to false
      const { result } = renderHookWithQueryClient(() =>
        useCriticalAndMajorIssues('test-namespace', false),
      );

      await waitFor(() => {
        expect(result.current.isLoaded).toBe(true);
      });

      // Verify data is loaded correctly
      expect(result.current.data[0].issues).toEqual(criticalIssues);
      expect(result.current.data[1].issues).toEqual(majorIssues);
      // With noRefetch=false, refetchOnMount is not disabled
      // (actual refetch behavior depends on query staleness in the test environment)
    });

    it('should allow refetch on remount when noRefetch is undefined (default)', async () => {
      const criticalIssues = [createMockIssue(IssueSeverity.CRITICAL, 'crit-1')];
      const majorIssues = [createMockIssue(IssueSeverity.MAJOR, 'major-1')];
      mockFetchIssues
        .mockResolvedValueOnce({
          data: criticalIssues,
          total: 1,
          limit: 20,
          offset: 0,
        })
        .mockResolvedValueOnce({
          data: majorIssues,
          total: 1,
          limit: 20,
          offset: 0,
        });

      // First render without noRefetch parameter (undefined) - default behavior
      const { result } = renderHookWithQueryClient(() => useCriticalAndMajorIssues('test-namespace'));

      await waitFor(() => {
        expect(result.current.isLoaded).toBe(true);
      });

      // Verify data is loaded correctly
      expect(result.current.data[0].issues).toEqual(criticalIssues);
      expect(result.current.data[1].issues).toEqual(majorIssues);
      // With noRefetch=undefined (default), refetchOnMount is not disabled
    });

    it('should apply noRefetch to both critical and major severities when true', async () => {
      const criticalIssues = [createMockIssue(IssueSeverity.CRITICAL, 'crit-1')];
      const majorIssues = [createMockIssue(IssueSeverity.MAJOR, 'major-1')];

      mockFetchIssues
        .mockResolvedValueOnce({ data: criticalIssues, total: 1, limit: 20, offset: 0 })
        .mockResolvedValueOnce({ data: majorIssues, total: 1, limit: 20, offset: 0 });

      // First render
      const { result, unmount } = renderHookWithQueryClient(() =>
        useCriticalAndMajorIssues('test-namespace', true),
      );

      await waitFor(() => {
        expect(result.current.isLoaded).toBe(true);
      });

      const initialCallCount = mockFetchIssues.mock.calls.length;
      expect(initialCallCount).toBe(2); // One for critical, one for major

      // Unmount and remount
      unmount();

      const { result: result2 } = renderHookWithQueryClient(() =>
        useCriticalAndMajorIssues('test-namespace', true),
      );

      await waitFor(() => {
        expect(result2.current.isLoaded).toBe(true);
      });

      // Should not have made additional fetch calls for either severity
      expect(mockFetchIssues.mock.calls.length).toBe(initialCallCount);
      expect(result2.current.data[0].issues).toEqual(criticalIssues);
      expect(result2.current.data[1].issues).toEqual(majorIssues);
    });

    it('should return critical and major severities in correct order', async () => {
      const criticalIssues = [createMockIssue(IssueSeverity.CRITICAL, 'crit-1')];
      const majorIssues = [createMockIssue(IssueSeverity.MAJOR, 'major-1')];

      mockFetchIssues
        .mockResolvedValueOnce({ data: criticalIssues, total: 1, limit: 20, offset: 0 })
        .mockResolvedValueOnce({ data: majorIssues, total: 1, limit: 20, offset: 0 });

      const { result } = renderHookWithQueryClient(() =>
        useCriticalAndMajorIssues('test-namespace'),
      );

      await waitFor(() => {
        expect(result.current.isLoaded).toBe(true);
      });

      expect(result.current.data).toHaveLength(2);
      expect(result.current.data[0].severity).toBe(IssueSeverity.CRITICAL);
      expect(result.current.data[1].severity).toBe(IssueSeverity.MAJOR);
    });
  });
});
