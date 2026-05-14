import * as React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook } from '@testing-library/react';
import { DataState, testPipelineRuns } from '~/__data__/pipelinerun-data';
import { PipelineRunKind } from '~/types';
import { TaskRunKind } from '~/types/task-run';
import { createTestQueryClient } from '~/unit-test-utils/mock-react-query';
import { usePipelineRunTestOutputResult } from '../usePipelineRunTestOutputResult';
import { useTaskRunsForPipelineRuns } from '../useTaskRunsV2';

jest.mock('../useTaskRunsV2', () => ({
  useTaskRunsForPipelineRuns: jest.fn(),
}));

const useTaskRunsForPipelineRunsMock = useTaskRunsForPipelineRuns as jest.Mock;

const defaultNextPageProps = { hasNextPage: false, isFetchingNextPage: false };
const defaultGetNextPage = jest.fn();

describe('usePipelineRunTestOutputResult', () => {
  let queryClient: QueryClient;

  const renderHookWithQueryClient = (plr: PipelineRunKind, namespace: string | null) => {
    return renderHook(() => usePipelineRunTestOutputResult(namespace, plr), {
      wrapper: ({ children }) =>
        React.createElement(QueryClientProvider, { client: queryClient }, children),
    });
  };

  beforeEach(() => {
    queryClient = createTestQueryClient();
    jest.clearAllMocks();
    useTaskRunsForPipelineRunsMock.mockReturnValue([
      [],
      true,
      null,
      defaultGetNextPage,
      defaultNextPageProps,
    ]);
  });

  describe('when pipeline run has TEST_OUTPUT in status.results', () => {
    it('returns aggregated counts from PLR-level TEST_OUTPUT and namespace is null', () => {
      const plr = testPipelineRuns[
        DataState.STATUS_WITH_TEST_OUTPUT_SUCCESS
      ] as unknown as PipelineRunKind;
      const { result } = renderHookWithQueryClient(plr, null);

      expect(result.current).toEqual([{ successes: 1, failures: 0, warnings: 0 }, false]);
    });

    it('returns aggregated counts from PLR-level TEST_OUTPUT with ERROR result', () => {
      const plr = testPipelineRuns[
        DataState.STATUS_WITH_TEST_OUTPUT_ERROR
      ] as unknown as PipelineRunKind;
      const { result } = renderHookWithQueryClient(plr, null);

      expect(result.current).toEqual([{ successes: 0, failures: 1, warnings: 0 }, false]);
    });

    it('uses PLR status over task runs when both are available', () => {
      const plr = testPipelineRuns[
        DataState.STATUS_WITH_TEST_OUTPUT_SUCCESS
      ] as unknown as PipelineRunKind;
      const taskRunsWithFailure: TaskRunKind[] = [
        {
          apiVersion: 'tekton.dev/v1',
          kind: 'TaskRun',
          metadata: { name: 'tr-1', namespace: 'ns', uid: '1', creationTimestamp: '' },
          spec: {},
          status: {
            results: [
              {
                name: 'TEST_OUTPUT',
                value:
                  '{"result": "FAILURE", "note": "From task run", "successes": 0, "failures": 1, "warnings": 0}',
              },
            ],
          },
        },
      ];
      useTaskRunsForPipelineRunsMock.mockReturnValue([
        taskRunsWithFailure,
        true,
        null,
        defaultGetNextPage,
        defaultNextPageProps,
      ]);

      const { result } = renderHookWithQueryClient(plr, 'test-ns');

      // PLR-level result takes priority
      expect(result.current[0]).toEqual({ successes: 1, failures: 0, warnings: 0 });
    });

    it('bypasses TaskRun query when PLR already has TEST_OUTPUT (calls hook with null namespace)', () => {
      const plr = testPipelineRuns[
        DataState.STATUS_WITH_TEST_OUTPUT_SUCCESS
      ] as unknown as PipelineRunKind;
      renderHookWithQueryClient(plr, 'test-ns');

      expect(useTaskRunsForPipelineRunsMock).toHaveBeenCalledWith(
        null,
        plr.metadata?.name,
        undefined,
        false,
      );
    });

    it('does not fetch TaskRuns when PLR has TEST_OUTPUT entry but value is malformed (invalid JSON)', () => {
      const plr = testPipelineRuns[
        DataState.STATUS_WITH_INVALID_TEST_OUTPUT_JSON_VALUE
      ] as unknown as PipelineRunKind;
      renderHookWithQueryClient(plr, 'test-ns');

      expect(useTaskRunsForPipelineRunsMock).toHaveBeenCalledWith(
        null,
        plr.metadata?.name,
        undefined,
        false,
      );
    });
  });

  describe('when pipeline run has no TEST_OUTPUT and task runs are used', () => {
    it('returns aggregated counts from task run results when namespace is set', () => {
      const plr = testPipelineRuns[
        DataState.STATUS_WITHOUT_TEST_OUTPUT_INFO
      ] as unknown as PipelineRunKind;
      const taskRunsWithSuccess: TaskRunKind[] = [
        {
          apiVersion: 'tekton.dev/v1',
          kind: 'TaskRun',
          metadata: { name: 'tr-1', namespace: 'ns', uid: '1', creationTimestamp: '' },
          spec: {},
          status: {
            results: [
              {
                name: 'TEST_OUTPUT',
                value:
                  '{"result": "SUCCESS", "namespace": "ns", "timestamp": "2025-01-01T00:00:00Z", "successes": 1, "failures": 0, "warnings": 0, "note": "All tests passed"}',
              },
            ],
          },
        },
      ];
      useTaskRunsForPipelineRunsMock.mockReturnValue([
        taskRunsWithSuccess,
        true,
        null,
        defaultGetNextPage,
        defaultNextPageProps,
      ]);

      const { result } = renderHookWithQueryClient(plr, 'test-ns');

      expect(result.current).toEqual([{ successes: 1, failures: 0, warnings: 0 }, false]);
    });

    it('aggregates counts across multiple task runs', () => {
      const plr = testPipelineRuns[
        DataState.STATUS_WITHOUT_TEST_OUTPUT_INFO
      ] as unknown as PipelineRunKind;
      const multipleTaskRuns: TaskRunKind[] = [
        {
          apiVersion: 'tekton.dev/v1',
          kind: 'TaskRun',
          metadata: { name: 'tr-1', namespace: 'ns', uid: '1', creationTimestamp: '' },
          spec: {},
          status: {
            results: [
              {
                name: 'TEST_OUTPUT',
                value: '{"result": "SUCCESS", "successes": 5, "failures": 0, "warnings": 1}',
              },
            ],
          },
        },
        {
          apiVersion: 'tekton.dev/v1',
          kind: 'TaskRun',
          metadata: { name: 'tr-2', namespace: 'ns', uid: '2', creationTimestamp: '' },
          spec: {},
          status: {
            results: [
              {
                name: 'TEST_OUTPUT',
                value: '{"result": "FAILURE", "successes": 2, "failures": 3, "warnings": 0}',
              },
            ],
          },
        },
      ];
      useTaskRunsForPipelineRunsMock.mockReturnValue([
        multipleTaskRuns,
        true,
        null,
        defaultGetNextPage,
        defaultNextPageProps,
      ]);

      const { result } = renderHookWithQueryClient(plr, 'test-ns');

      expect(result.current[0]).toEqual({ successes: 7, failures: 3, warnings: 1 });
    });

    it('returns null when task runs have no numeric fields', () => {
      const plr = testPipelineRuns[
        DataState.STATUS_WITHOUT_TEST_OUTPUT_INFO
      ] as unknown as PipelineRunKind;
      const taskRunsWithNoNumericFields: TaskRunKind[] = [
        {
          apiVersion: 'tekton.dev/v1',
          kind: 'TaskRun',
          metadata: { name: 'tr-1', namespace: 'ns', uid: '1', creationTimestamp: '' },
          spec: {},
          status: {
            results: [
              {
                name: 'TEST_OUTPUT',
                value: '{"result": "SUCCESS", "note": "old format without counts"}',
              },
            ],
          },
        },
      ];
      useTaskRunsForPipelineRunsMock.mockReturnValue([
        taskRunsWithNoNumericFields,
        true,
        null,
        defaultGetNextPage,
        defaultNextPageProps,
      ]);

      const { result } = renderHookWithQueryClient(plr, 'test-ns');

      expect(result.current[0]).toBeNull();
    });
  });

  describe('loading state', () => {
    it('returns isLoading false when namespace is null', () => {
      const plr = testPipelineRuns[
        DataState.STATUS_WITH_TEST_OUTPUT_SUCCESS
      ] as unknown as PipelineRunKind;
      useTaskRunsForPipelineRunsMock.mockReturnValue([
        [],
        false,
        null,
        defaultGetNextPage,
        defaultNextPageProps,
      ]);

      const { result } = renderHookWithQueryClient(plr, null);

      expect(result.current[1]).toBe(false);
    });

    it('returns isLoading true when namespace is set and task runs are not loaded', () => {
      const plr = testPipelineRuns[
        DataState.STATUS_WITHOUT_TEST_OUTPUT_INFO
      ] as unknown as PipelineRunKind;
      useTaskRunsForPipelineRunsMock.mockReturnValue([
        [],
        false,
        null,
        defaultGetNextPage,
        defaultNextPageProps,
      ]);

      const { result } = renderHookWithQueryClient(plr, 'test-ns');

      expect(result.current[1]).toBe(true);
    });

    it('returns isLoading false when namespace is set and task runs are loaded', () => {
      const plr = testPipelineRuns[
        DataState.STATUS_WITHOUT_TEST_OUTPUT_INFO
      ] as unknown as PipelineRunKind;
      useTaskRunsForPipelineRunsMock.mockReturnValue([
        [],
        true,
        null,
        defaultGetNextPage,
        defaultNextPageProps,
      ]);

      const { result } = renderHookWithQueryClient(plr, 'test-ns');

      expect(result.current[1]).toBe(false);
    });
  });

  describe('TaskRun fallback error path', () => {
    it('does not show loading (avoids stuck spinner) when TaskRun fetch returns an error', () => {
      const plr = testPipelineRuns[
        DataState.STATUS_WITHOUT_TEST_OUTPUT_INFO
      ] as unknown as PipelineRunKind;
      const fetchError = new Error('TaskRun list failed');
      useTaskRunsForPipelineRunsMock.mockReturnValue([
        [],
        true,
        fetchError,
        defaultGetNextPage,
        defaultNextPageProps,
      ]);

      const { result } = renderHookWithQueryClient(plr, 'test-ns');

      expect(result.current[1]).toBe(false);
      expect(result.current[0]).toBe(null);
    });

    it('does not show loading when TaskRun fetch errors and loaded is false', () => {
      const plr = testPipelineRuns[
        DataState.STATUS_WITHOUT_TEST_OUTPUT_INFO
      ] as unknown as PipelineRunKind;
      useTaskRunsForPipelineRunsMock.mockReturnValue([
        [],
        false,
        new Error('Network error'),
        defaultGetNextPage,
        defaultNextPageProps,
      ]);

      const { result } = renderHookWithQueryClient(plr, 'test-ns');

      expect(result.current[1]).toBe(false);
    });
  });

  describe('when no test result is available', () => {
    it('returns [null, false] when PLR has no TEST_OUTPUT and task runs are empty', () => {
      const plr = testPipelineRuns[
        DataState.STATUS_WITHOUT_TEST_OUTPUT_INFO
      ] as unknown as PipelineRunKind;
      useTaskRunsForPipelineRunsMock.mockReturnValue([
        [],
        true,
        null,
        defaultGetNextPage,
        defaultNextPageProps,
      ]);

      const { result } = renderHookWithQueryClient(plr, 'test-ns');

      expect(result.current).toEqual([null, false]);
    });

    it('returns [null, false] for PLR with null status', () => {
      const plr = {
        ...testPipelineRuns[DataState.STATUS_WITHOUT_TEST_OUTPUT_INFO],
        status: null,
      } as unknown as PipelineRunKind;
      useTaskRunsForPipelineRunsMock.mockReturnValue([
        [],
        true,
        null,
        defaultGetNextPage,
        defaultNextPageProps,
      ]);

      const { result } = renderHookWithQueryClient(plr, null);

      expect(result.current).toEqual([null, false]);
    });
  });
});
