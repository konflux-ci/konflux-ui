import { renderHook } from '@testing-library/react-hooks';
import { useIsOnFeatureFlag } from '~/feature-flags/hooks';
import { mockUseNamespaceHook } from '~/unit-test-utils/mock-namespace';
import { DataState, testPipelineRuns } from '../../__data__/pipelinerun-data';
import { PipelineRunKind } from '../../types';
import { usePLRScanResults, usePLRVulnerabilities, useScanResults } from '../useScanResults';
import { useTaskRunsForPipelineRuns } from '../useTaskRunsV2';
import { useTRTaskRuns } from '../useTektonResults';

jest.mock('../useTektonResults', () => ({
  useTRTaskRuns: jest.fn(() => [
    [],
    true,
    undefined,
    () => {},
    { isFetchingNextPage: false, hasNextPage: false },
  ]),
}));
const useTRTaskRunsMock = useTRTaskRuns as jest.Mock;

jest.mock('../useTaskRunsV2', () => ({
  useTaskRunsForPipelineRuns: jest.fn(() => [
    [],
    true,
    undefined,
    () => {},
    { isFetchingNextPage: false, hasNextPage: false },
  ]),
  useTaskRunsV2: jest.fn(() => [
    [],
    true,
    undefined,
    () => {},
    { isFetchingNextPage: false, hasNextPage: false },
  ]),
}));

const useTaskRunsForPipelineRunsMock = useTaskRunsForPipelineRuns as jest.Mock;

jest.mock('~/kubearchive/hooks', () => ({
  useKubearchiveListResourceQuery: jest.fn(() => [
    [],
    true,
    undefined,
    () => {},
    { isFetchingNextPage: false, hasNextPage: false },
  ]),
}));

jest.mock('~/feature-flags/hooks', () => ({
  useIsOnFeatureFlag: jest.fn(),
}));
const useFeatureIsOnMock = useIsOnFeatureFlag as jest.Mock;

const taskRunData = [
  {
    metadata: {
      labels: { 'tekton.dev/pipelineRun': 'test', 'tekton.dev/pipelineTask': 'clair-scan' },
    },
    spec: { taskRef: { name: 'clair-scan' } },
    status: {
      results: [
        {
          name: 'CVE_SCAN_RESULT',
          value:
            '{ "vulnerabilities": { "critical": 1, "high": 2, "medium": 3, "low": 4, "unknown": 5 } }',
        },
      ],
    },
  },
  {
    metadata: {
      labels: { 'tekton.dev/pipelineRun': 'test2', 'tekton.dev/pipelineTask': 'clair-scan' },
    },
    spec: { taskRef: { name: 'clair-scan' } },
    status: {
      results: [
        {
          name: 'CLAIR_SCAN_RESULT',
          value:
            '{ "vulnerabilities": { "critical": 5, "high": 2, "medium": 0, "low": 4, "unknown": 1 } }',
        },
      ],
    },
  },
];

describe('useScanResults', () => {
  mockUseNamespaceHook('test-ns');

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('returns null if results are not fetched', () => {
    useTaskRunsForPipelineRunsMock.mockReturnValue([
      null,
      false,
      undefined,
      () => {},
      { isFetchingNextPage: false, hasNextPage: false },
    ]);
    const { result } = renderHook(() => useScanResults('test'));
    expect(result.current).toEqual([undefined, false, undefined]);
  });

  it('returns null if scan results are not found in taskrun', () => {
    useTaskRunsForPipelineRunsMock.mockReturnValue([
      [],
      true,
      undefined,
      () => {},
      { isFetchingNextPage: false, hasNextPage: false },
    ]);
    const { result } = renderHook(() => useScanResults('test'));
    expect(result.current).toEqual([null, true]);
  });

  it('returns scan results if taskrun is found', () => {
    useTaskRunsForPipelineRunsMock.mockReturnValue([
      [taskRunData[0]],
      true,
      undefined,
      () => {},
      { isFetchingNextPage: false, hasNextPage: false },
    ]);
    const { result } = renderHook(() => useScanResults('test'));
    expect(result.current).toEqual([
      { vulnerabilities: { critical: 1, high: 2, medium: 3, low: 4, unknown: 5 } },
      true,
      undefined,
    ]);
  });
});

describe('usePLRScanResults', () => {
  it('returns null if results are not fetched', () => {
    useTRTaskRunsMock.mockReturnValue([
      null,
      false,
      undefined,
      () => {},
      { isFetchingNextPage: false, hasNextPage: false },
    ]);
    const { result } = renderHook(() => usePLRScanResults(['test1']));
    expect(result.current).toEqual([null, false, [], undefined]);
  });

  it('returns null if scan results are not found in taskrun', () => {
    useTRTaskRunsMock.mockReturnValue([
      [],
      true,
      undefined,
      () => {},
      { isFetchingNextPage: false, hasNextPage: false },
    ]);
    const { result } = renderHook(() => usePLRScanResults(['test2']));
    expect(result.current).toEqual([null, true, [], undefined]);
  });

  it('returns error if scan results API is failing', () => {
    const badGatewayError = new Error('502: bad gateway error');
    useTRTaskRunsMock.mockReturnValue([
      [],
      true,
      badGatewayError,
      undefined,
      { isFetchingNextPage: false, hasNextPage: false },
    ]);
    const { result } = renderHook(() => usePLRScanResults(['test2']));
    expect(result.current).toEqual([null, true, [], badGatewayError]);
  });

  it('returns scan results if taskrun is found', () => {
    useTRTaskRunsMock.mockReturnValue([
      taskRunData,
      true,
      undefined,
      () => {},
      { isFetchingNextPage: false, hasNextPage: false },
    ]);
    const { result } = renderHook(() => usePLRScanResults(['test', 'test2']));
    const [scanResultsMap, loaded] = result.current;
    expect(Object.keys(scanResultsMap)).toEqual(['test', 'test2']);
    const vulnerabilities = Object.values(scanResultsMap);

    const [map1] = vulnerabilities[0] as { vulnerabilities: Record<string, unknown> }[];
    expect(map1.vulnerabilities).toEqual({
      critical: 1,
      high: 2,
      low: 4,
      medium: 3,
      unknown: 5,
    });
    const [map2] = vulnerabilities[1] as { vulnerabilities: Record<string, unknown> }[];
    expect(map2.vulnerabilities).toEqual({
      critical: 5,
      high: 2,
      low: 4,
      medium: 0,
      unknown: 1,
    });
    expect(loaded).toBe(true);
  });
});

describe('usePLRVulnerabilities', () => {
  beforeEach(() => {
    useFeatureIsOnMock.mockImplementation(() => false);
  });
  it('returns default values if taskruns are not available', () => {
    useTRTaskRunsMock.mockReturnValue([
      null,
      false,
      undefined,
      () => {},
      { isFetchingNextPage: false, hasNextPage: false },
    ]);
    const { result } = renderHook(() =>
      usePLRVulnerabilities([testPipelineRuns[DataState.SUCCEEDED]] as PipelineRunKind[]),
    );
    expect(result.current).toEqual({ fetchedPipelineRuns: [], vulnerabilities: {} });
  });

  it('returns vulnerabilities when scan taskrun are available', () => {
    useTRTaskRunsMock.mockReturnValue([
      [taskRunData[0]],
      true,
      undefined,
      () => {},
      { isFetchingNextPage: false, hasNextPage: false },
    ]);

    const { result } = renderHook(() =>
      usePLRVulnerabilities([testPipelineRuns[DataState.SUCCEEDED]] as PipelineRunKind[]),
    );
    expect(result.current.vulnerabilities).toEqual(
      expect.objectContaining({
        test: expect.arrayContaining([
          { vulnerabilities: { critical: 1, high: 2, low: 4, medium: 3, unknown: 5 } },
        ]),
      }),
    );
  });
});
