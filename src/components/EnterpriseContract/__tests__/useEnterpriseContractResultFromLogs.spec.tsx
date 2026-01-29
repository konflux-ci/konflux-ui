import * as React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook } from '@testing-library/react-hooks';
import { useTaskRunsForPipelineRuns } from '../../../hooks/useTaskRunsV2';
import { mockUseNamespaceHook } from '../../../unit-test-utils/mock-namespace';
import { getTaskRunLog } from '../../../utils/tekton-results';
import { createK8sUtilMock, createTestQueryClient } from '../../../utils/test-utils';
import {
  mockEnterpriseContractJSON,
  mockEnterpriseContractUIData,
} from '../__data__/mockEnterpriseContractLogsJson';
import { ComponentEnterpriseContractResult } from '../types';
import {
  mapEnterpriseContractResultData,
  useEnterpriseContractResultFromLogs,
  useEnterpriseContractResults,
} from '../useEnterpriseContractResultFromLogs';

jest.mock('../../../hooks/useTaskRunsV2', () => ({
  useTaskRunsForPipelineRuns: jest.fn(),
}));

jest.mock('../../../utils/tekton-results', () => ({
  getTaskRunLog: jest.fn(),
}));

const mockGetTaskRunLogs = getTaskRunLog as jest.Mock;
const mockCommmonFetchJSON = createK8sUtilMock('commonFetchJSON');
const mockUseTaskRunsForPipelineRuns = useTaskRunsForPipelineRuns as jest.Mock;

const createDefaultMockImplementation = () => {
  return (_namespace: string, _pipelineRunName: string, taskName?: string) => {
    if (taskName === 'verify') {
      return [
        [
          {
            metadata: {
              namespace: 'test-ns',
              name: 'test-taskrun',
              uid: 'test-uid',
            },
            status: {
              podName: 'pod-acdf',
            },
          },
        ],
        true,
        undefined,
        jest.fn(),
        { hasNextPage: false, isFetchingNextPage: false },
      ];
    }

    return [[], true, undefined, jest.fn(), { hasNextPage: false, isFetchingNextPage: false }];
  };
};

describe('useEnterpriseContractResultFromLogs', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    jest.clearAllMocks();
    mockCommmonFetchJSON.mockResolvedValue(mockEnterpriseContractJSON);
    mockUseNamespaceHook('test-ns');
    mockUseTaskRunsForPipelineRuns.mockImplementation(createDefaultMockImplementation());
  });

  const renderHookWithQueryClient = (pipelineRunName: string) => {
    return renderHook(() => useEnterpriseContractResultFromLogs(pipelineRunName), {
      wrapper: ({ children }: { children: React.ReactNode }) =>
        React.createElement(QueryClientProvider, { client: queryClient }, children),
    });
  };

  it('should parse valid rules to json', async () => {
    const { result, waitForNextUpdate } = renderHookWithQueryClient('dummy-abcd');
    await waitForNextUpdate();
    expect(mockCommmonFetchJSON).toHaveBeenCalled();
    expect(result.current[0][0].successes.length).toEqual(1);
    expect(result.current[0][0].violations.length).toEqual(1);
    expect(result.current[0][0].warnings).toEqual(undefined);
  });

  it('should call tknResults when taskRun has no podName', async () => {
    mockUseTaskRunsForPipelineRuns.mockImplementation(
      (_namespace: string, _pipelineRunName: string, taskName?: string) => {
        if (taskName === 'verify') {
          return [
            [
              {
                metadata: {
                  namespace: 'test-ns',
                  name: 'test-taskrun',
                  uid: 'test-uid',
                },
                status: {},
              },
            ],
            true,
            undefined,
            jest.fn(),
            { hasNextPage: false, isFetchingNextPage: false },
          ];
        }
        return [[], true, undefined, jest.fn(), { hasNextPage: false, isFetchingNextPage: false }];
      },
    );
    mockGetTaskRunLogs.mockResolvedValue(`
      step-vulnerabilities :-
      Lorem Ipsum some logs
      
      step-report-json :-
      {"success":true,"components":[]}
      
      step-something-else :-
      Some other logs
    `);
    const { result, waitForNextUpdate } = renderHookWithQueryClient('dummy-abcd');
    await waitForNextUpdate();
    expect(mockGetTaskRunLogs).toHaveBeenCalled();
    const [, loaded] = result.current;
    expect(loaded).toBe(true);
  });

  it('should filter out all 404 image url components from EC results', async () => {
    const { result, waitForNextUpdate } = renderHookWithQueryClient('dummy-abcd');
    await waitForNextUpdate();
    const [ecResult, loaded] = result.current;
    expect(mockCommmonFetchJSON).toHaveBeenCalled();
    expect(loaded).toBe(true);
    expect(ecResult.findIndex((ec) => ec.name === 'devfile-sample-1jik')).toEqual(-1);
  });

  it('should return handle api errors', async () => {
    mockCommmonFetchJSON.mockRejectedValue(new Error('Api error'));

    const { result, waitForNextUpdate } = renderHookWithQueryClient('dummy-abcd');
    await waitForNextUpdate();
    const [ecResult, loaded] = result.current;
    expect(mockCommmonFetchJSON).toHaveBeenCalled();
    expect(loaded).toBe(true);
    expect(ecResult).toBeUndefined();
  });

  it('should use verify-conforma when verify task run does not exist', async () => {
    mockUseTaskRunsForPipelineRuns.mockImplementation(
      (_namespace: string, _pipelineRunName: string, taskName?: string) => {
        if (taskName === 'verify-conforma') {
          return [
            [
              {
                status: {
                  podName: 'pod-conforma',
                },
              },
            ],
            true,
            undefined,
            jest.fn(),
            { hasNextPage: false, isFetchingNextPage: false },
          ];
        }

        return [[], true, undefined, jest.fn(), { hasNextPage: false, isFetchingNextPage: false }];
      },
    );
    const { result, waitForNextUpdate } = renderHookWithQueryClient('dummy-abcd');
    await waitForNextUpdate();
    expect(mockCommmonFetchJSON).toHaveBeenCalled();
    expect(mockCommmonFetchJSON).toHaveBeenLastCalledWith(
      '/api/v1/namespaces/test-ns/pods/pod-conforma/log?container=step-report-json&follow=true',
    );
    const [ecResult, loaded] = result.current;
    expect(loaded).toBe(true);
    expect(ecResult).toBeDefined();
  });

  it('should return handle 404 error', async () => {
    mockCommmonFetchJSON.mockRejectedValue({ code: 404 });
    mockGetTaskRunLogs.mockResolvedValue(`
      step-vulnerabilities :-
      Lorem Ipsum some logs
      
      step-report-json :-
      {"success":true,"components":[]}
      
      step-something-else :-
      Some other logs
    `);

    const { result, waitForNextUpdate } = renderHookWithQueryClient('dummy-abcd');
    const [, loaded] = result.current;
    expect(mockCommmonFetchJSON).toHaveBeenCalled();
    expect(loaded).toBe(true);
    await waitForNextUpdate();
    const [ec, ecLoaded] = result.current;
    expect(mockGetTaskRunLogs).toHaveBeenCalled();
    expect(ecLoaded).toBe(true);
    expect(ec).toEqual([]);
  });
});

describe('mapEnterpriseContractResultData', () => {
  it('should map to data consumable by UI', () => {
    const uiData = mapEnterpriseContractResultData([
      mockEnterpriseContractJSON.components[2],
    ] as ComponentEnterpriseContractResult[]);

    expect(uiData.length).toEqual(2);
    expect(uiData[0].status).toEqual('Failed');
    expect(uiData[0].solution).toEqual('solution for failure');
    expect(uiData.findIndex((u) => u.status === 'Warning')).toEqual(-1);
  });

  it('should map solution data to failed results', () => {
    const uiData = mapEnterpriseContractResultData([
      mockEnterpriseContractJSON.components[2],
    ] as ComponentEnterpriseContractResult[]);
    expect(uiData[0].status).toEqual('Failed');
    expect(uiData[0].solution).toEqual('solution for failure');
    expect(uiData).toEqual(mockEnterpriseContractUIData);
  });
});

describe('useEnterpriseContractResults', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    jest.clearAllMocks();
    mockCommmonFetchJSON.mockResolvedValue(mockEnterpriseContractJSON);
    mockUseTaskRunsForPipelineRuns.mockImplementation(createDefaultMockImplementation());
  });

  const renderHookWithQueryClient = (pipelineRunName: string) => {
    return renderHook(() => useEnterpriseContractResults(pipelineRunName), {
      wrapper: ({ children }: { children: React.ReactNode }) =>
        React.createElement(QueryClientProvider, { client: queryClient }, children),
    });
  };

  it('should return enterprise contract results', async () => {
    const { result, waitForNextUpdate } = renderHookWithQueryClient('dummy-abcd');
    expect(result.current[0]).toEqual(undefined);
    expect(result.current[1]).toEqual(true);
    await waitForNextUpdate();
    expect(result.current[0]).toEqual(mockEnterpriseContractUIData);
    expect(result.current[1]).toEqual(true);
  });
});
