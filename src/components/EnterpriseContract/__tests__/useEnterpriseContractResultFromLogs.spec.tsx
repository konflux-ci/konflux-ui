import { renderHook } from '@testing-library/react-hooks';
import { useTaskRuns } from '../../../hooks/useTaskRuns';
import { mockUseNamespaceHook } from '../../../unit-test-utils/mock-namespace';
import { getTaskRunLog } from '../../../utils/tekton-results';
import { createK8sUtilMock } from '../../../utils/test-utils';
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

jest.mock('../../../hooks/useTaskRuns', () => ({
  useTaskRuns: jest.fn(),
}));

jest.mock('../../../utils/tekton-results', () => ({
  getTaskRunLog: jest.fn(),
}));

const mockGetTaskRunLogs = getTaskRunLog as jest.Mock;
const mockCommmonFetchJSON = createK8sUtilMock('commonFetchJSON');
const mockUseTaskRuns = useTaskRuns as jest.Mock;

describe('useEnterpriseContractResultFromLogs', () => {
  beforeEach(() => {
    mockCommmonFetchJSON.mockResolvedValue(mockEnterpriseContractJSON);
    mockUseNamespaceHook('test-ns');
    mockUseTaskRuns.mockReturnValue([
      [
        {
          status: {
            podName: 'pod-acdf',
          },
        },
      ],
      true,
      undefined,
    ]);
  });

  it('should parse valid rules to json', async () => {
    const { result, waitForNextUpdate } = renderHook(() =>
      useEnterpriseContractResultFromLogs('dummy-abcd'),
    );
    await waitForNextUpdate();
    expect(mockCommmonFetchJSON).toHaveBeenCalled();
    expect(result.current[0][0].successes.length).toEqual(1);
    expect(result.current[0][0].violations.length).toEqual(1);
    expect(result.current[0][0].warnings).toEqual(undefined);
  });

  it('should call tknResults when taskRun is empty array', () => {
    mockUseTaskRuns.mockReturnValueOnce([[], true, undefined]);
    mockGetTaskRunLogs.mockReturnValue(`asdfcdfadsf
      [report-json] { "components": [] }
      `);
    const { result } = renderHook(() => useEnterpriseContractResultFromLogs('dummy-abcd'));
    const [, loaded] = result.current;
    expect(mockCommmonFetchJSON).toHaveBeenCalled();
    expect(loaded).toBe(true);
    expect(mockCommmonFetchJSON).toHaveBeenLastCalledWith(
      '/api/v1/namespaces/test-ns/pods/pod-acdf/log?container=step-report-json&follow=true',
    );
  });

  it('should filter out all 404 image url components from EC results', async () => {
    const { result, waitForNextUpdate } = renderHook(() =>
      useEnterpriseContractResultFromLogs('dummy-abcd'),
    );
    await waitForNextUpdate();
    const [ecResult, loaded] = result.current;
    expect(mockCommmonFetchJSON).toHaveBeenCalled();
    expect(loaded).toBe(true);
    expect(ecResult.findIndex((ec) => ec.name === 'devfile-sample-1jik')).toEqual(-1);
  });

  it('should return handle api errors', async () => {
    mockCommmonFetchJSON.mockRejectedValue(new Error('Api error'));

    const { result, waitForNextUpdate } = renderHook(() =>
      useEnterpriseContractResultFromLogs('dummy-abcd'),
    );
    await waitForNextUpdate();
    const [ecResult, loaded] = result.current;
    expect(mockCommmonFetchJSON).toHaveBeenCalled();
    expect(loaded).toBe(true);
    expect(ecResult).toBeUndefined();
  });

  it('should return handle 404 error', async () => {
    mockUseTaskRuns.mockReturnValue([
      [
        {
          metadata: {
            namespace: 'asd',
            name: 'asd',
          },
          status: {
            podName: 'pod-acdf',
          },
        },
      ],
      true,
      undefined,
    ]);
    mockCommmonFetchJSON.mockRejectedValue({ code: 404 });
    mockGetTaskRunLogs.mockReturnValue(`asdfcdfadsf
    [report-json] { "components": [] }
    `);

    const { result, waitForNextUpdate } = renderHook(() =>
      useEnterpriseContractResultFromLogs('dummy-abcd'),
    );
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
  beforeEach(() => {
    mockCommmonFetchJSON.mockResolvedValue(mockEnterpriseContractJSON);
    mockUseTaskRuns.mockReturnValue([
      [
        {
          status: {
            podName: 'pod-acdf',
          },
        },
      ],
      true,
      undefined,
    ]);
  });

  it('should return enterprise contract results', async () => {
    const { result, waitForNextUpdate } = renderHook(() =>
      useEnterpriseContractResults('dummy-abcd'),
    );
    expect(result.current[0]).toEqual(undefined);
    expect(result.current[1]).toEqual(false);
    await waitForNextUpdate();
    expect(result.current[0]).toEqual(mockEnterpriseContractUIData);
    expect(result.current[1]).toEqual(true);
  });
});
