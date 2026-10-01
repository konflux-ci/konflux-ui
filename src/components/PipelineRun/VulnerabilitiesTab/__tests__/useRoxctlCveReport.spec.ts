import * as React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { TaskRunKind } from '~/types';
import { createTestQueryClient } from '~/unit-test-utils';
import type { RoxctlFlatCveEntry } from '../types';
import { useRoxctlCveReport } from '../useRoxctlCveReport';

jest.mock('~/feature-flags/hooks', () => ({
  ...jest.requireActual('~/feature-flags/hooks'),
  useIsOnFeatureFlag: jest.fn().mockReturnValue(false),
}));

jest.mock('~/shared/providers/Namespace/useNamespaceInfo', () => {
  const actual = jest.requireActual('~/shared/providers/Namespace/useNamespaceInfo');
  return {
    ...actual,
    useNamespace: jest.fn().mockReturnValue('test-ns'),
  };
});

const mockResolveRoxctlCveReport = jest.fn();
jest.mock('../roxctl-fetchers', () => ({
  resolveRoxctlCveReport: (...args: unknown[]) => mockResolveRoxctlCveReport(...args),
}));

const mockToRows = jest.fn();
jest.mock('../roxctl-utils', () => ({
  toRows: (...args: unknown[]) => mockToRows(...args),
}));

const mockTaskRun: TaskRunKind = {
  apiVersion: 'tekton.dev/v1',
  kind: 'TaskRun',
  metadata: {
    name: 'roxctl-scan-task-run',
    namespace: 'test-ns',
    uid: 'test-uid-123',
  },
  spec: {},
  status: {
    podName: 'roxctl-scan-pod',
    completionTime: '2026-09-27T10:00:00Z',
    conditions: [],
  },
};

const mockIncompleteTaskRun: TaskRunKind = {
  ...mockTaskRun,
  status: {
    conditions: [],
  },
};

const mockFlatEntries: RoxctlFlatCveEntry[] = [
  {
    cve: 'CVE-2024-1234',
    severity: 'CRITICAL_VULNERABILITY_SEVERITY',
    components: [{ component: 'openssl', version: '3.0.5' }],
  },
];

const mockRows = [
  {
    cve: 'CVE-2024-1234',
    severity: 'CRITICAL' as const,
    fixedBy: '3.0.6',
    componentName: 'openssl',
    componentVersion: '3.0.5',
  },
];

describe('useRoxctlCveReport', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    jest.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);

  it('should not fetch until the TaskRun is complete', async () => {
    const { result } = renderHook(() => useRoxctlCveReport(mockIncompleteTaskRun), { wrapper });

    await waitFor(() => expect(result.current.fetchStatus).toBe('idle'));

    expect(mockResolveRoxctlCveReport).not.toHaveBeenCalled();
  });

  it('should fetch and convert CVE data to rows for a valid taskRun', async () => {
    mockResolveRoxctlCveReport.mockResolvedValue({
      reports: [mockFlatEntries],
      imagePlatforms: ['linux/amd64'],
    });
    mockToRows.mockReturnValue(mockRows);

    const { result } = renderHook(() => useRoxctlCveReport(mockTaskRun), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockResolveRoxctlCveReport).toHaveBeenCalledWith('test-ns', mockTaskRun, false);
    expect(mockToRows).toHaveBeenCalledWith([mockFlatEntries], ['linux/amd64']);
    expect(result.current.data).toEqual(mockRows);
    expect(result.current.error).toBeNull();
  });

  it('should only convert CVE data when the query data changes', async () => {
    mockResolveRoxctlCveReport.mockResolvedValue({
      reports: [mockFlatEntries],
      imagePlatforms: ['linux/amd64'],
    });
    mockToRows.mockReturnValue(mockRows);

    const { result, rerender } = renderHook(() => useRoxctlCveReport(mockTaskRun), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    const callsAfterFetch = mockToRows.mock.calls.length;
    expect(callsAfterFetch).toBeGreaterThan(0);

    rerender();

    expect(mockToRows).toHaveBeenCalledTimes(callsAfterFetch);
  });

  it('should return only fixable rows from the flattened report', async () => {
    mockResolveRoxctlCveReport.mockResolvedValue({
      reports: [mockFlatEntries],
      imagePlatforms: ['linux/amd64'],
    });
    mockToRows.mockReturnValue([
      {
        cve: 'CVE-2024-1234',
        severity: 'CRITICAL' as const,
        fixedBy: '3.0.6',
        componentName: 'openssl',
        componentVersion: '3.0.5',
      },
      {
        cve: 'CVE-2023-9999',
        severity: 'MEDIUM' as const,
        componentName: 'curl',
        componentVersion: '7.80.0',
      },
    ]);

    const { result } = renderHook(() => useRoxctlCveReport(mockTaskRun), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toHaveLength(1);
    expect(result.current.data[0].cve).toBe('CVE-2024-1234');
  });

  it('should return error when fetcher rejects', async () => {
    mockResolveRoxctlCveReport.mockRejectedValue(
      new Error('No valid roxctl CVE report JSON found'),
    );

    const { result } = renderHook(() => useRoxctlCveReport(mockTaskRun), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.data).toBeUndefined();
  });

  it('should fetch when the TaskRun gains a completion time', async () => {
    mockResolveRoxctlCveReport.mockResolvedValue({ reports: [], imagePlatforms: [] });
    mockToRows.mockReturnValue([]);

    const { result, rerender } = renderHook(
      ({ taskRun }: { taskRun: TaskRunKind }) => useRoxctlCveReport(taskRun),
      {
        initialProps: { taskRun: mockIncompleteTaskRun },
        wrapper,
      },
    );

    await waitFor(() => expect(result.current.fetchStatus).toBe('idle'));
    expect(mockResolveRoxctlCveReport).not.toHaveBeenCalled();

    rerender({ taskRun: mockTaskRun });

    await waitFor(() => {
      expect(mockResolveRoxctlCveReport).toHaveBeenCalledTimes(1);
    });
  });

  it('should not fetch when taskRun has no uid', () => {
    const taskRunNoUid: TaskRunKind = {
      ...mockTaskRun,
      metadata: { ...mockTaskRun.metadata, uid: undefined },
    };

    const { result } = renderHook(() => useRoxctlCveReport(taskRunNoUid), { wrapper });

    expect(result.current.isLoading).toBe(false);
    expect(mockResolveRoxctlCveReport).not.toHaveBeenCalled();
  });
});
