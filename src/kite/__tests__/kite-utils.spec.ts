import * as React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { commonFetchJSON, getQueryString } from '~/k8s';
import { IssueKind, IssueQuery, IssueSeverity, IssueType, IssueState } from '~/types';
import {
  fetchIssues,
  createGetIssueQueryOptions,
  createInfiniteIssueQueryOptions,
  useIssues,
  useInfiniteIssues,
} from '../kite-utils';

// Mock the k8s utilities
jest.mock('~/k8s', () => ({
  commonFetchJSON: jest.fn(),
  getQueryString: jest.fn(),
}));

const mockCommonFetchJSON = commonFetchJSON as jest.MockedFunction<typeof commonFetchJSON>;
const mockGetQueryString = getQueryString as jest.MockedFunction<typeof getQueryString>;

// Mock data
const mockIssue: IssueKind = {
  apiVersion: 'v1',
  kind: 'Issue',
  metadata: {
    name: 'test-issue',
    namespace: 'test-namespace',
    uid: 'test-uid',
    creationTimestamp: '2023-01-01T00:00:00Z',
  },
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

const mockIssues: IssueKind[] = [mockIssue];

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
        pathPrefix: 'plugins/kite',
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
        pathPrefix: 'plugins/kite',
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
        queryKey: ['kite', 'issues', mockIssueQuery],
        queryFn: expect.any(Function),
        staleTime: 1000 * 60 * 5, // 5 minutes
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

      expect(options.queryKey).toEqual(['kite', 'issues', differentQuery]);
    });
  });

  describe('createInfiniteIssueQueryOptions', () => {
    it('should return correct infinite query options', () => {
      const options = createInfiniteIssueQueryOptions(mockIssueQuery);

      expect(options).toEqual({
        queryKey: ['kite', 'issues', mockIssueQuery],
        queryFn: expect.any(Function),
        initialPageParam: 0,
        getNextPageParam: expect.any(Function),
        staleTime: 1000 * 60 * 5, // 5 minutes
      });
    });

    it('should create query function with pagination', async () => {
      const options = createInfiniteIssueQueryOptions(mockIssueQuery);
      mockGetQueryString.mockReturnValue('namespace=test-namespace');
      mockCommonFetchJSON.mockResolvedValue(mockIssues);

      const result = await options.queryFn({ pageParam: 20 });

      expect(mockCommonFetchJSON).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/issues/?'),
        { pathPrefix: 'plugins/kite' },
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
        const result = options.getNextPageParam([], []);

        expect(result).toBeUndefined();
      });

      it('should return undefined when last page has fewer items than limit', () => {
        const options = createInfiniteIssueQueryOptions(mockIssueQuery);
        const lastPage = [mockIssue]; // Only 1 item, limit is 20
        const allPages = [[mockIssue], [mockIssue]];

        const result = options.getNextPageParam(lastPage, allPages);

        expect(result).toBeUndefined();
      });

      it('should return next offset when last page is full', () => {
        const options = createInfiniteIssueQueryOptions(mockIssueQuery);
        const lastPage = Array(20).fill(mockIssue); // Full page
        const allPages = [Array(20).fill(mockIssue), Array(20).fill(mockIssue)];

        const result = options.getNextPageParam(lastPage, allPages);

        expect(result).toBe(40); // 2 pages * 20 items per page
      });

      it('should use custom limit in getNextPageParam', () => {
        const queryWithCustomLimit: IssueQuery = { namespace: 'test-namespace', limit: 10 };
        const options = createInfiniteIssueQueryOptions(queryWithCustomLimit);
        const lastPage = Array(10).fill(mockIssue); // Full page with custom limit
        const allPages = [Array(10).fill(mockIssue), Array(10).fill(mockIssue)];

        const result = options.getNextPageParam(lastPage, allPages);

        expect(result).toBe(20); // 2 pages * 10 items per page
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

      expect(result.current).toEqual([undefined, true, null]);
    });

    it('should return data when query succeeds', async () => {
      mockGetQueryString.mockReturnValue('namespace=test-namespace');
      mockCommonFetchJSON.mockResolvedValue(mockIssues);

      const { result } = renderHookWithQueryClient(mockIssueQuery);

      await waitFor(() => {
        expect(result.current[0]).toEqual(mockIssues);
        expect(result.current[1]).toBe(false);
        expect(result.current[2]).toBeNull();
      });
    });

    it('should return error when query fails', async () => {
      const error = new Error('Query failed');
      mockGetQueryString.mockReturnValue('namespace=test-namespace');
      mockCommonFetchJSON.mockRejectedValue(error);

      const { result } = renderHookWithQueryClient(mockIssueQuery);

      await waitFor(() => {
        expect(result.current[0]).toBeUndefined();
        expect(result.current[1]).toBe(false);
        expect(result.current[2]).toEqual(error);
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

      expect(result.current).toEqual([
        undefined,
        true,
        null,
        expect.any(Function),
        false,
        true,
        false,
      ]);
    });

    it('should return data when query succeeds', async () => {
      mockGetQueryString.mockReturnValue('namespace=test-namespace');
      mockCommonFetchJSON.mockResolvedValue(mockIssues);

      const { result } = renderHookWithQueryClient(mockIssueQuery);

      await waitFor(() => {
        expect(result.current[0]).toBeDefined();
        expect(result.current[1]).toBe(false); // isLoading
        expect(result.current[2]).toBeNull(); // error
        expect(typeof result.current[3]).toBe('function'); // fetchNextPage
        expect(result.current[4]).toBe(false); // hasNextPage
        expect(result.current[5]).toBe(false); // isFetching
        expect(result.current[6]).toBe(false); // isFetchingNextPage
      });
    });

    it('should return error when query fails', async () => {
      const error = new Error('Query failed');
      mockGetQueryString.mockReturnValue('namespace=test-namespace');
      mockCommonFetchJSON.mockRejectedValue(error);

      const { result } = renderHookWithQueryClient(mockIssueQuery);

      await waitFor(() => {
        expect(result.current[0]).toBeUndefined();
        expect(result.current[1]).toBe(false); // isLoading
        expect(result.current[2]).toEqual(error); // error
        expect(typeof result.current[3]).toBe('function'); // fetchNextPage
        expect(result.current[4]).toBe(false); // hasNextPage
        expect(result.current[5]).toBe(false); // isFetching
        expect(result.current[6]).toBe(false); // isFetchingNextPage
      });
    });

    it('should handle fetchNextPage function', async () => {
      mockGetQueryString.mockReturnValue('namespace=test-namespace');
      mockCommonFetchJSON.mockResolvedValue(mockIssues);

      const { result } = renderHookWithQueryClient(mockIssueQuery);

      await waitFor(() => {
        expect(result.current[3]).toBeDefined(); // fetchNextPage function exists
      });

      // Test that fetchNextPage is callable
      expect(() => (result.current[3] as () => void)()).not.toThrow();
    });
  });
});
