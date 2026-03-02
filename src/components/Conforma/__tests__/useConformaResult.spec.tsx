import * as React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook } from '@testing-library/react-hooks';
import { CONFORMA_TASK, EC_TASK, ENTERPRISE_CONTRACT_LABEL } from '~/consts/security';
import { ComponentConformaResult } from '~/types/conforma';
import { usePipelineRunV2 } from '../../../hooks/usePipelineRunsV2';
import { useTaskRunsForPipelineRuns } from '../../../hooks/useTaskRunsV2';
import { mockUseNamespaceHook } from '../../../unit-test-utils/mock-namespace';
import { getTaskRunLog } from '../../../utils/tekton-results';
import { createK8sUtilMock, createTestQueryClient } from '../../../utils/test-utils';
import { mockConformaJSON, mockConformaUIData } from '../__data__/mockConformaLogsJson';
import {
  mapConformaResultData,
  useConformaResultFromLogs,
  useConformaResult,
} from '../useConformaResult';

jest.mock('../../../hooks/useTaskRunsV2', () => ({
  useTaskRunsForPipelineRuns: jest.fn(),
}));

jest.mock('../../../hooks/usePipelineRunsV2', () => ({
  usePipelineRunV2: jest.fn(),
}));

jest.mock('../../../utils/tekton-results', () => ({
  getTaskRunLog: jest.fn(),
}));

const mockGetTaskRunLogs = getTaskRunLog as jest.Mock;
const mockCommmonFetchJSON = createK8sUtilMock('commonFetchJSON');
const mockUseTaskRunsForPipelineRuns = useTaskRunsForPipelineRuns as jest.Mock;
const mockUsePipelineRunV2 = usePipelineRunV2 as jest.Mock;

const createDefaultMockImplementation = () => {
  return (_namespace: string, _pipelineRunName: string, taskName?: string) => {
    if (taskName === EC_TASK) {
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

describe('useConformaResult', () => {
  let queryClient: QueryClient;

  const mockEnterpriseContractPipelineRun = {
    metadata: {
      name: 'test-pipelinerun',
      labels: {
        [ENTERPRISE_CONTRACT_LABEL]: 'enterprise-contract',
      },
    },
    status: {
      pipelineSpec: {
        tasks: [{ name: EC_TASK }],
      },
    },
  };

  const mockConformaPipelineRun = {
    metadata: {
      name: 'test-pipelinerun',
    },
    status: {
      pipelineSpec: {
        tasks: [{ name: CONFORMA_TASK }],
      },
    },
  };

  const mockRegularPipelineRun = {
    metadata: {
      name: 'test-pipelinerun',
    },
    status: {
      pipelineSpec: {
        tasks: [{ name: 'build' }],
      },
    },
  };

  beforeEach(() => {
    queryClient = createTestQueryClient();
    jest.clearAllMocks();
    mockCommmonFetchJSON.mockResolvedValue(mockConformaJSON);
    mockUseNamespaceHook('test-ns');
    mockUsePipelineRunV2.mockReturnValue([mockEnterpriseContractPipelineRun, true, null]);
    mockUseTaskRunsForPipelineRuns.mockImplementation(createDefaultMockImplementation());
  });

  const renderHookWithQueryClient = (pipelineRunName: string) => {
    return renderHook(() => useConformaResultFromLogs(pipelineRunName), {
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

  it('should call useTaskRunsForPipelineRuns with verify when pipeline run has EC task run', () => {
    mockUsePipelineRunV2.mockReturnValue([mockEnterpriseContractPipelineRun, true, null]);
    renderHookWithQueryClient('dummy-abcd');

    expect(mockUseTaskRunsForPipelineRuns).toHaveBeenCalledWith('test-ns', 'dummy-abcd', EC_TASK);
  });

  it('should call useTaskRunsForPipelineRuns with verify-conforma when pipeline run has Conforma task run', () => {
    mockUsePipelineRunV2.mockReturnValue([mockConformaPipelineRun, true, null]);
    mockUseTaskRunsForPipelineRuns.mockImplementation(
      (_namespace: string, _pipelineRunName: string, taskName?: string) => {
        if (taskName === CONFORMA_TASK) {
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

    renderHookWithQueryClient('dummy-abcd');

    expect(mockUseTaskRunsForPipelineRuns).toHaveBeenCalledWith(
      'test-ns',
      'dummy-abcd',
      CONFORMA_TASK,
    );
  });

  it('should call useTaskRunsForPipelineRuns with undefined namespace when no security task exists', () => {
    mockUsePipelineRunV2.mockReturnValue([mockRegularPipelineRun, true, null]);
    renderHookWithQueryClient('dummy-abcd');

    expect(mockUseTaskRunsForPipelineRuns).toHaveBeenCalledWith(undefined, 'dummy-abcd', undefined);
  });

  it('should call useTaskRunsForPipelineRuns with undefined parameters when pipeline run is not loaded', () => {
    mockUsePipelineRunV2.mockReturnValue([null, false, null]);
    renderHookWithQueryClient('dummy-abcd');

    expect(mockUseTaskRunsForPipelineRuns).toHaveBeenCalledWith(undefined, 'dummy-abcd', undefined);
  });

  it('should call useTaskRunsForPipelineRuns with undefined parameters when pipeline run has error', () => {
    mockUsePipelineRunV2.mockReturnValue([null, true, new Error('Pipeline run error')]);
    renderHookWithQueryClient('dummy-abcd');

    expect(mockUseTaskRunsForPipelineRuns).toHaveBeenCalledWith(undefined, 'dummy-abcd', undefined);
  });

  it('should call tknResults when taskRun has no podName', async () => {
    mockUseTaskRunsForPipelineRuns.mockImplementation(
      (_namespace: string, _pipelineRunName: string, taskName?: string) => {
        if (taskName === EC_TASK) {
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
    mockUsePipelineRunV2.mockReturnValue([mockConformaPipelineRun, true, null]);
    mockUseTaskRunsForPipelineRuns.mockImplementation(
      (_namespace: string, _pipelineRunName: string, taskName?: string) => {
        if (taskName === CONFORMA_TASK) {
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
    expect(loaded).toBe(false);
    await waitForNextUpdate();
    const [ec, ecLoaded] = result.current;
    expect(mockGetTaskRunLogs).toHaveBeenCalled();
    expect(ecLoaded).toBe(true);
    expect(ec).toEqual([]);
  });
});

describe('mapConformaResultData', () => {
  it('should map to data consumable by UI', () => {
    const uiData = mapConformaResultData([
      mockConformaJSON.components[2],
    ] as ComponentConformaResult[]);

    expect(uiData.length).toEqual(2);
    expect(uiData[0].status).toEqual('Failed');
    expect(uiData[0].solution).toEqual('solution for failure');
    expect(uiData.findIndex((u) => u.status === 'Warning')).toEqual(-1);
  });

  it('should map solution data to failed results', () => {
    const uiData = mapConformaResultData([
      mockConformaJSON.components[2],
    ] as ComponentConformaResult[]);
    expect(uiData[0].status).toEqual('Failed');
    expect(uiData[0].solution).toEqual('solution for failure');
    expect(uiData).toEqual(mockConformaUIData);
  });
});

describe('useConformaResult', () => {
  let queryClient: QueryClient;

  const mockEnterpriseContractPipelineRun = {
    metadata: {
      name: 'test-pipelinerun',
      labels: {
        [ENTERPRISE_CONTRACT_LABEL]: 'enterprise-contract',
      },
    },
    status: {
      pipelineSpec: {
        tasks: [{ name: EC_TASK }],
      },
    },
  };

  beforeEach(() => {
    queryClient = createTestQueryClient();
    jest.clearAllMocks();
    mockCommmonFetchJSON.mockResolvedValue(mockConformaJSON);
    mockUseNamespaceHook('test-ns');
    mockUsePipelineRunV2.mockReturnValue([mockEnterpriseContractPipelineRun, true, null]);
    mockUseTaskRunsForPipelineRuns.mockImplementation(createDefaultMockImplementation());
  });

  const renderHookWithQueryClient = (pipelineRunName: string) => {
    return renderHook(() => useConformaResult(pipelineRunName), {
      wrapper: ({ children }: { children: React.ReactNode }) =>
        React.createElement(QueryClientProvider, { client: queryClient }, children),
    });
  };

  it('should return conforma results', async () => {
    const { result, waitForNextUpdate } = renderHookWithQueryClient('dummy-abcd');
    expect(result.current[0]).toEqual(undefined);
    expect(result.current[1]).toEqual(false);
    await waitForNextUpdate();
    expect(result.current[0]).toEqual(mockConformaUIData);
    expect(result.current[1]).toEqual(true);
  });
});
