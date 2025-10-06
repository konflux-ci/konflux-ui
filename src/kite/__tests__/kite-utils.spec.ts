import * as React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { commonFetchJSON, getQueryString } from '~/k8s';
import { PLUGIN_KITE, STALE_TIME } from '../const';
import { Issue, IssueQuery, IssueSeverity, IssueType, IssueState } from '../issue-type';
import { fetchIssues } from '../kite-fetch';
import { useIssues, useInfiniteIssues } from '../kite-hooks';
import { createGetIssueQueryOptions, createInfiniteIssueQueryOptions } from '../kite-query';

// Mock the k8s utilities
jest.mock('~/k8s', () => ({
  commonFetchJSON: jest.fn(),
  getQueryString: jest.fn(),
}));

const mockCommonFetchJSON = commonFetchJSON as jest.MockedFunction<typeof commonFetchJSON>;
const mockGetQueryString = getQueryString as jest.MockedFunction<typeof getQueryString>;

// Mock data
const mockIssue: Issue = {
  id: 'test-issue-id',
  title: 'Test Issue',
  description: 'This is a test issue',
  severity: IssueSeverity.MINOR,
  issueType: IssueType.BUILD,
  state: IssueState.ACTIVE,
  detectedAt: '2023-01-01T00:00:00Z',
  namespace: 'test-namespace',
  scope: {
    resourceType: 'PipelineRun',
    resourceName: 'test-pipeline',
    resourceNamespace: 'test-namespace',
  },
  links: ['https://example.com/issue'],
  createdAt: '2023-01-01T00:00:00Z',
  updatedAt: '2023-01-01T00:00:00Z',
};

const mockIssues: Issue[] = [mockIssue];

const mockIssueQuery: IssueQuery = {
  namespace: 'test-namespace',
  severity: IssueSeverity.MINOR,
  issueType: IssueType.BUILD,
  state: IssueState.ACTIVE,
  limit: 20,
  offset: 0,
};

describe('kite-utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchIssues', () => {
    it('should call commonFetchJSON with correct parameters', async () => {
      const expectedApi = '/api/v1/issues/?';
      const expectedQueryString = 'namespace=test-namespace&severity=minor';
      const expectedResourcePath = expectedApi + expectedQueryString;

      mockGetQueryString.mockReturnValue(expectedQueryString);
      mockCommonFetchJSON.mockResolvedValue(mockIssues);

      const result = await fetchIssues(mockIssueQuery);

      expect(mockGetQueryString).toHaveBeenCalledWith(mockIssueQuery);
      expect(mockCommonFetchJSON).toHaveBeenCalledWith(expectedResourcePath, {
        pathPrefix: PLUGIN_KITE,
      });
      expect(result).toEqual(mockIssues);
    });

    it('should handle empty query parameters', async () => {
      const emptyQuery: IssueQuery = { namespace: 'test-namespace' };
      const expectedQueryString = 'namespace=test-namespace';

      mockGetQueryString.mockReturnValue(expectedQueryString);
      mockCommonFetchJSON.mockResolvedValue([]);

      await fetchIssues(emptyQuery);

      expect(mockGetQueryString).toHaveBeenCalledWith(emptyQuery);
      expect(mockCommonFetchJSON).toHaveBeenCalledWith('/api/v1/issues/?namespace=test-namespace', {
        pathPrefix: PLUGIN_KITE,
      });
    });

    it('should handle API errors', async () => {
      const error = new Error('API Error');
      mockGetQueryString.mockReturnValue('namespace=test-namespace');
      mockCommonFetchJSON.mockRejectedValue(error);

      await expect(fetchIssues(mockIssueQuery)).rejects.toThrow('API Error');
    });
  });

  describe('createGetIssueQueryOptions', () => {
    it('should return correct query options', () => {
      const options = createGetIssueQueryOptions(mockIssueQuery);

      expect(options).toEqual({
        queryKey: [PLUGIN_KITE, mockIssueQuery],
        queryFn: expect.any(Function),
        staleTime: STALE_TIME,
      });
    });

    it('should create query function that calls fetchIssues', async () => {
      const options = createGetIssueQueryOptions(mockIssueQuery);
      mockGetQueryString.mockReturnValue('namespace=test-namespace');
      mockCommonFetchJSON.mockResolvedValue(mockIssues);

      const result = await options.queryFn();

      expect(result).toEqual(mockIssues);
    });

    it('should handle different query parameters', () => {
      const differentQuery: IssueQuery = {
        namespace: 'different-namespace',
        severity: IssueSeverity.CRITICAL,
        limit: 10,
      };

      const options = createGetIssueQueryOptions(differentQuery);

      expect(options.queryKey).toEqual([PLUGIN_KITE, differentQuery]);
    });
  });

  describe('createInfiniteIssueQueryOptions', () => {
    it('should return correct infinite query options', () => {
      const options = createInfiniteIssueQueryOptions(mockIssueQuery);

      expect(options).toEqual({
        queryKey: [PLUGIN_KITE, mockIssueQuery],
        queryFn: expect.any(Function),
        initialPageParam: undefined,
        getNextPageParam: expect.any(Function),
        staleTime: STALE_TIME,
      });
    });

    it('should create query function with pagination', async () => {
      const options = createInfiniteIssueQueryOptions(mockIssueQuery);
      mockGetQueryString.mockReturnValue('namespace=test-namespace');
      mockCommonFetchJSON.mockResolvedValue(mockIssues);

      const result = await options.queryFn({ pageParam: 20 });

      expect(mockCommonFetchJSON).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/issues/?'),
        { pathPrefix: PLUGIN_KITE },
      );
      expect(result).toEqual(mockIssues);
    });

    it('should use default page size when limit is not provided', async () => {
      const queryWithoutLimit: IssueQuery = { namespace: 'test-namespace' };
      const options = createInfiniteIssueQueryOptions(queryWithoutLimit);
      mockGetQueryString.mockReturnValue('namespace=test-namespace');
      mockCommonFetchJSON.mockResolvedValue(mockIssues);

      await options.queryFn({ pageParam: 0 });

      // Should use default page size of 20
      expect(mockGetQueryString).toHaveBeenCalledWith({
        namespace: 'test-namespace',
        offset: 0,
        limit: 20,
      });
    });

    it('should use provided limit when available', async () => {
      const queryWithLimit: IssueQuery = { namespace: 'test-namespace', limit: 50 };
      const options = createInfiniteIssueQueryOptions(queryWithLimit);
      mockGetQueryString.mockReturnValue('namespace=test-namespace');
      mockCommonFetchJSON.mockResolvedValue(mockIssues);

      await options.queryFn({ pageParam: 0 });

      expect(mockGetQueryString).toHaveBeenCalledWith({
        namespace: 'test-namespace',
        offset: 0,
        limit: 50,
      });
    });

    describe('getNextPageParam', () => {
      it('should return undefined when last page is empty', () => {
        const options = createInfiniteIssueQueryOptions(mockIssueQuery);
        const lastPage = {
          data: [],
          total: 0,
          limit: 20,
          offset: 0,
        };
        const result = options.getNextPageParam(lastPage);

        expect(result).toBeUndefined();
      });

      it('should return undefined when last page has fewer items than limit', () => {
        const options = createInfiniteIssueQueryOptions(mockIssueQuery);
        const lastPage = {
          data: [mockIssue], // Only 1 item, limit is 20
          total: 1,
          limit: 20,
          offset: 0,
        };

        const result = options.getNextPageParam(lastPage);

        expect(result).toBeUndefined();
      });

      it('should return next offset when last page is full', () => {
        const options = createInfiniteIssueQueryOptions(mockIssueQuery);
        const lastPage = {
          data: Array(20).fill(mockIssue), // Full page
          total: 40,
          limit: 20,
          offset: 20,
        };

        const result = options.getNextPageParam(lastPage);

        expect(result).toBe(20); // offset from the last page
      });

      it('should use custom limit in getNextPageParam', () => {
        const queryWithCustomLimit: IssueQuery = { namespace: 'test-namespace', limit: 10 };
        const options = createInfiniteIssueQueryOptions(queryWithCustomLimit);
        const lastPage = {
          data: Array(10).fill(mockIssue), // Full page with custom limit
          total: 20,
          limit: 10,
          offset: 10,
        };

        const result = options.getNextPageParam(lastPage);

        expect(result).toBe(10); // offset from the last page
      });
    });
  });

  describe('useIssues', () => {
    let queryClient: QueryClient;

    const renderHookWithQueryClient = (issueQuery: IssueQuery) => {
      return renderHook(() => useIssues(issueQuery), {
        wrapper: ({ children }) =>
          React.createElement(QueryClientProvider, { client: queryClient }, children),
      });
    };

    beforeEach(() => {
      queryClient = new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
          },
        },
      });
    });

    it('should return loading state initially', () => {
      mockGetQueryString.mockReturnValue('namespace=test-namespace');
      mockCommonFetchJSON.mockImplementation(() => new Promise(() => {})); // Never resolves

      const { result } = renderHookWithQueryClient(mockIssueQuery);

      expect(result.current.data).toBeUndefined();
      expect(result.current.isLoading).toBe(true);
      expect(result.current.error).toBeNull();
    });

    it('should return data when query succeeds', async () => {
      mockGetQueryString.mockReturnValue('namespace=test-namespace');
      mockCommonFetchJSON.mockResolvedValue(mockIssues);

      const { result } = renderHookWithQueryClient(mockIssueQuery);

      await waitFor(() => {
        expect(result.current.data).toEqual(mockIssues);
        expect(result.current.isLoading).toBe(false);
        expect(result.current.error).toBeNull();
      });
    });

    it('should return error when query fails', async () => {
      const error = new Error('Query failed');
      mockGetQueryString.mockReturnValue('namespace=test-namespace');
      mockCommonFetchJSON.mockRejectedValue(error);

      const { result } = renderHookWithQueryClient(mockIssueQuery);

      await waitFor(() => {
        expect(result.current.data).toBeUndefined();
        expect(result.current.isLoading).toBe(false);
        expect(result.current.error).toEqual(error);
      });
    });
  });

  describe('useInfiniteIssues', () => {
    let queryClient: QueryClient;

    const renderHookWithQueryClient = (issueQuery: IssueQuery) => {
      return renderHook(() => useInfiniteIssues(issueQuery), {
        wrapper: ({ children }) =>
          React.createElement(QueryClientProvider, { client: queryClient }, children),
      });
    };

    beforeEach(() => {
      queryClient = new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
          },
        },
      });
    });

    it('should return loading state initially', () => {
      mockGetQueryString.mockReturnValue('namespace=test-namespace');
      mockCommonFetchJSON.mockImplementation(() => new Promise(() => {})); // Never resolves

      const { result } = renderHookWithQueryClient(mockIssueQuery);

      expect(result.current.data).toBeUndefined();
      expect(result.current.isLoading).toBe(true);
      expect(result.current.error).toBeNull();
      expect(typeof result.current.fetchNextPage).toBe('function');
      expect(result.current.hasNextPage).toBe(false);
      expect(result.current.isFetchingNextPage).toBe(false);
    });

    it('should return data when query succeeds', async () => {
      mockGetQueryString.mockReturnValue('namespace=test-namespace');
      mockCommonFetchJSON.mockResolvedValue(mockIssues);

      const { result } = renderHookWithQueryClient(mockIssueQuery);

      await waitFor(() => {
        expect(result.current.data).toBeDefined();
        expect(result.current.isLoading).toBe(false);
        expect(result.current.error).toBeNull();
        expect(typeof result.current.fetchNextPage).toBe('function');
        expect(result.current.hasNextPage).toBe(false);
        expect(result.current.isFetchingNextPage).toBe(false);
      });
    });

    it('should return error when query fails', async () => {
      const error = new Error('Query failed');
      mockGetQueryString.mockReturnValue('namespace=test-namespace');
      mockCommonFetchJSON.mockRejectedValue(error);

      const { result } = renderHookWithQueryClient(mockIssueQuery);

      await waitFor(() => {
        expect(result.current.data).toBeUndefined();
        expect(result.current.isLoading).toBe(false);
        expect(result.current.error).toEqual(error);
        expect(typeof result.current.fetchNextPage).toBe('function');
        expect(result.current.hasNextPage).toBe(false);
        expect(result.current.isFetchingNextPage).toBe(false);
      });
    });

    it('should handle fetchNextPage function', async () => {
      mockGetQueryString.mockReturnValue('namespace=test-namespace');
      mockCommonFetchJSON.mockResolvedValue(mockIssues);

      const { result } = renderHookWithQueryClient(mockIssueQuery);

      await waitFor(() => {
        expect(result.current.fetchNextPage).toBeDefined(); // fetchNextPage function exists
      });

      // Test that fetchNextPage is callable
      expect(() => result.current.fetchNextPage()).not.toThrow();
    });
  });
});
