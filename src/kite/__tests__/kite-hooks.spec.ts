import * as React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { createTestQueryClient } from '~/unit-test-utils/mock-react-query';
import { fetchIssues } from '../kite-fetch';
import { useIssueCountsBySeverity, useIssueCountsByType } from '../kite-hooks';

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
});
