import { renderHook } from '@testing-library/react-hooks';
import { mockIssues } from '~/components/Issues/__data__/mock-issues-data';
import { commonFetch } from '~/k8s/fetch';
import { IssuesApiParams } from '~/types/issues';
import { useIssues, useLatestIssues } from '../useIssues';

jest.mock('~/k8s/fetch');

const mockCommonFetch = commonFetch as jest.MockedFunction<typeof commonFetch>;

describe('useIssues', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCommonFetch.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          data: mockIssues,
          total: mockIssues.length,
          limit: 10,
          offset: 0,
        }),
    } as Response);
  });

  it('returns issues with default parameters', async () => {
    const { result, waitForNextUpdate } = renderHook(() => useIssues());

    expect(result.current[1]).toBe(false); // loading
    expect(result.current[2]).toBeUndefined(); // no error

    await waitForNextUpdate();

    expect(result.current[0]).toEqual({
      data: mockIssues,
      total: mockIssues.length,
      limit: 10,
      offset: 0,
    });
    expect(result.current[1]).toBe(true); // loaded
    expect(result.current[2]).toBeUndefined(); // no error
  });

  it('filters issues by namespace', async () => {
    const params: IssuesApiParams = { namespace: 'test-namespace' };
    const { result, waitForNextUpdate } = renderHook(() => useIssues(params));

    await waitForNextUpdate();

    expect(mockCommonFetch).toHaveBeenCalledWith(
      '/api/v1/issues?namespace=test-namespace&state=ACTIVE&limit=10&offset=0',
    );
    expect(result.current[1]).toBe(true);
  });

  it('filters issues by severity', async () => {
    const params: IssuesApiParams = { severity: 'critical' };
    const { result, waitForNextUpdate } = renderHook(() => useIssues(params));

    await waitForNextUpdate();

    expect(mockCommonFetch).toHaveBeenCalledWith(
      '/api/v1/issues?severity=critical&state=ACTIVE&limit=10&offset=0',
    );
    expect(result.current[1]).toBe(true);
  });

  it('filters issues by issue type', async () => {
    const params: IssuesApiParams = { issueType: 'pipeline' };
    const { result, waitForNextUpdate } = renderHook(() => useIssues(params));

    await waitForNextUpdate();

    expect(mockCommonFetch).toHaveBeenCalledWith(
      '/api/v1/issues?issueType=pipeline&state=ACTIVE&limit=10&offset=0',
    );
    expect(result.current[1]).toBe(true);
  });

  it('filters issues by state', async () => {
    const params: IssuesApiParams = { state: 'RESOLVED' };
    const { result, waitForNextUpdate } = renderHook(() => useIssues(params));

    await waitForNextUpdate();

    expect(mockCommonFetch).toHaveBeenCalledWith('/api/v1/issues?state=RESOLVED&limit=10&offset=0');
    expect(result.current[1]).toBe(true);
  });

  it('applies pagination correctly', async () => {
    const params: IssuesApiParams = { limit: 3, offset: 2 };
    const { result, waitForNextUpdate } = renderHook(() => useIssues(params));

    await waitForNextUpdate();

    expect(mockCommonFetch).toHaveBeenCalledWith('/api/v1/issues?state=ACTIVE&limit=3&offset=2');
    expect(result.current[1]).toBe(true);
  });

  it('handles multiple filters simultaneously', async () => {
    const params: IssuesApiParams = {
      namespace: 'test-namespace',
      severity: 'critical',
      issueType: 'release',
      state: 'ACTIVE',
      limit: 5,
      offset: 1,
    };
    const { result, waitForNextUpdate } = renderHook(() => useIssues(params));

    await waitForNextUpdate();

    expect(mockCommonFetch).toHaveBeenCalledWith(
      '/api/v1/issues?namespace=test-namespace&severity=critical&issueType=release&state=ACTIVE&limit=5&offset=1',
    );
    expect(result.current[1]).toBe(true);
  });

  it('handles API errors', async () => {
    mockCommonFetch.mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    } as Response);

    const { result, waitForNextUpdate } = renderHook(() => useIssues());

    expect(result.current[1]).toBe(false); // loading
    expect(result.current[2]).toBeUndefined(); // no error initially

    await waitForNextUpdate();

    expect(result.current[0]).toBeUndefined(); // no data
    expect(result.current[1]).toBe(true); // not loading
    expect(result.current[2]).toBeInstanceOf(Error); // error present
    expect(result.current[2].message).toBe('Failed to fetch issues: 500 Internal Server Error');
  });

  it('handles network errors', async () => {
    mockCommonFetch.mockRejectedValue(new Error('Network error'));

    const { result, waitForNextUpdate } = renderHook(() => useIssues());

    expect(result.current[1]).toBe(false); // loading

    await waitForNextUpdate();

    expect(result.current[0]).toBeUndefined(); // no data
    expect(result.current[1]).toBe(true); // not loading
    expect(result.current[2]).toBeInstanceOf(Error); // error present
    expect(result.current[2].message).toBe('Network error');
  });

  it('cancels requests when component unmounts', () => {
    const { unmount } = renderHook(() => useIssues());

    // Unmount immediately before API call resolves
    unmount();

    // Should not throw or cause memory leaks
    expect(mockCommonFetch).toHaveBeenCalled();
  });

  it('updates when parameters change', async () => {
    let params: IssuesApiParams = { namespace: 'ns1' };
    const { waitForNextUpdate, rerender } = renderHook(() => useIssues(params));

    await waitForNextUpdate();
    expect(mockCommonFetch).toHaveBeenCalledWith(
      '/api/v1/issues?namespace=ns1&state=ACTIVE&limit=10&offset=0',
    );

    // Change parameters
    params = { namespace: 'ns2' };
    rerender();

    await waitForNextUpdate();
    expect(mockCommonFetch).toHaveBeenCalledWith(
      '/api/v1/issues?namespace=ns2&state=ACTIVE&limit=10&offset=0',
    );
    expect(mockCommonFetch).toHaveBeenCalledTimes(2);
  });
});

describe('useLatestIssues', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCommonFetch.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          data: mockIssues.slice(0, 3),
          total: 3,
          limit: 5,
          offset: 0,
        }),
    } as Response);
  });

  it('returns latest issues with default limit', async () => {
    const { result, waitForNextUpdate } = renderHook(() => useLatestIssues('test-ns'));

    expect(result.current[1]).toBe(false); // loading
    expect(result.current[2]).toBeUndefined(); // no error

    await waitForNextUpdate();

    expect(mockCommonFetch).toHaveBeenCalledWith(
      '/api/v1/issues?namespace=test-ns&state=ACTIVE&limit=5&offset=0',
    );
    expect(result.current[1]).toBe(true); // loaded
    expect(result.current[2]).toBeUndefined(); // no error
  });

  it('respects custom limit parameter', async () => {
    const { result, waitForNextUpdate } = renderHook(() => useLatestIssues('test-ns', 3));

    await waitForNextUpdate();

    expect(mockCommonFetch).toHaveBeenCalledWith(
      '/api/v1/issues?namespace=test-ns&state=ACTIVE&limit=3&offset=0',
    );
    expect(result.current[1]).toBe(true);
  });

  it('filters by namespace correctly', async () => {
    const { result, waitForNextUpdate } = renderHook(() => useLatestIssues('custom-namespace'));

    await waitForNextUpdate();

    expect(mockCommonFetch).toHaveBeenCalledWith(
      '/api/v1/issues?namespace=custom-namespace&state=ACTIVE&limit=5&offset=0',
    );
    expect(result.current[1]).toBe(true);
  });

  it('handles undefined namespace', async () => {
    const { result, waitForNextUpdate } = renderHook(() => useLatestIssues(undefined));

    await waitForNextUpdate();

    expect(mockCommonFetch).toHaveBeenCalledWith('/api/v1/issues?state=ACTIVE&limit=5&offset=0');
    expect(result.current[1]).toBe(true);
  });

  it('only returns ACTIVE issues', async () => {
    const { result, waitForNextUpdate } = renderHook(() => useLatestIssues('test-ns'));

    await waitForNextUpdate();

    expect(mockCommonFetch).toHaveBeenCalledWith(
      '/api/v1/issues?namespace=test-ns&state=ACTIVE&limit=5&offset=0',
    );
    expect(result.current[1]).toBe(true);
  });
});
