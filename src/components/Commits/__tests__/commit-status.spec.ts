import { renderHook } from '@testing-library/react-hooks';
import { runStatus, SucceedConditionReason } from '~/consts/pipelinerun';
import { usePipelineRunsForCommitV2 } from '~/hooks/usePipelineRunsForCommitV2';
import { PipelineRunKind } from '~/types';
import { pipelineWithCommits } from '../__data__/pipeline-with-commits';
import { getCommitStatusFromPipelineRuns, useCommitStatus } from '../commit-status';

jest.mock('../../../hooks/usePipelineRunsForCommitV2', () => ({
  usePipelineRunsForCommitV2: jest.fn(),
}));

const usePipelineRunsForCommitMock = usePipelineRunsForCommitV2 as jest.Mock;

const createMockPipelineRun = (status: runStatus): PipelineRunKind => {
  const basePipelineRun: PipelineRunKind = {
    apiVersion: 'tekton.dev/v1',
    kind: 'PipelineRun',
    metadata: {
      name: `test-pipeline-run-${Math.random().toString(36).substr(2, 9)}`,
      namespace: 'test-namespace',
      creationTimestamp: '2024-01-01T00:00:00Z',
    },
    spec: {},
    status: {
      conditions: [],
      pipelineSpec: null,
    },
  };

  switch (status) {
    case runStatus.Succeeded:
      basePipelineRun.status.conditions = [
        {
          type: 'Succeeded',
          status: 'True',
          reason: 'Completed',
        },
      ];
      break;
    case runStatus.Failed:
      basePipelineRun.status.conditions = [
        {
          type: 'Succeeded',
          status: 'False',
          reason: 'Failed',
        },
      ];
      break;
    case runStatus.Running:
      basePipelineRun.status.conditions = [
        {
          type: 'Succeeded',
          status: 'Unknown',
        },
      ];
      break;
    case runStatus['In Progress']:
      basePipelineRun.status.conditions = [
        {
          type: 'Succeeded',
          status: 'Unknown',
        },
      ];
      break;
    case runStatus.Pending:
      basePipelineRun.status.conditions = [
        {
          type: 'Succeeded',
          status: 'Unknown',
          reason: SucceedConditionReason.PipelineRunPending,
        },
      ];
      break;
    case runStatus.Cancelled:
      basePipelineRun.status.conditions = [
        {
          type: 'Succeeded',
          status: 'False',
          reason: SucceedConditionReason.Cancelled,
        },
      ];
      break;
    case runStatus.Unknown:
      basePipelineRun.status.conditions = [];
      break;
    default:
      basePipelineRun.status.conditions = [];
  }

  return basePipelineRun;
};

describe('getCommitStatusFromPipelineRuns', () => {
  it('should return Failed when any pipeline run has Failed status', () => {
    const pipelineRuns = [
      createMockPipelineRun(runStatus.Succeeded),
      createMockPipelineRun(runStatus.Failed),
      createMockPipelineRun(runStatus.Running),
    ];
    expect(getCommitStatusFromPipelineRuns(pipelineRuns)).toBe(runStatus.Failed);
  });

  it('should return Running when any pipeline run is Running', () => {
    const pipelineRuns = [
      createMockPipelineRun(runStatus.Succeeded),
      createMockPipelineRun(runStatus.Running),
      createMockPipelineRun(runStatus.Pending),
    ];
    expect(getCommitStatusFromPipelineRuns(pipelineRuns)).toBe(runStatus.Running);
  });

  it('should return Running when any pipeline run is In Progress', () => {
    const pipelineRuns = [
      createMockPipelineRun(runStatus.Succeeded),
      createMockPipelineRun(runStatus['In Progress']),
      createMockPipelineRun(runStatus.Pending),
    ];

    expect(getCommitStatusFromPipelineRuns(pipelineRuns)).toBe(runStatus.Running);
  });

  it('should return Succeeded when all pipeline runs are successful', () => {
    const pipelineRuns = [
      createMockPipelineRun(runStatus.Succeeded),
      createMockPipelineRun(runStatus.Succeeded),
      createMockPipelineRun(runStatus.Succeeded),
    ];
    expect(getCommitStatusFromPipelineRuns(pipelineRuns)).toBe(runStatus.Succeeded);
  });

  it('should not return Succeeded when not all are successful', () => {
    const pipelineRuns = [
      createMockPipelineRun(runStatus.Succeeded),
      createMockPipelineRun(runStatus.Pending),
    ];
    expect(getCommitStatusFromPipelineRuns(pipelineRuns)).not.toBe(runStatus.Succeeded);
  });

  it('should prioritize Unknown status over Succeeded status', () => {
    const pipelineRuns = [
      createMockPipelineRun(runStatus.Succeeded),
      createMockPipelineRun(runStatus.Unknown),
    ];

    expect(getCommitStatusFromPipelineRuns(pipelineRuns)).toBe(runStatus.Pending);
  });

  it('should prioritize Cancelled status over Succeeded status', () => {
    const pipelineRuns = [
      createMockPipelineRun(runStatus.Succeeded),
      createMockPipelineRun(runStatus.Cancelled),
    ];

    expect(getCommitStatusFromPipelineRuns(pipelineRuns)).toBe(runStatus.Cancelled);
  });

  it('should prioritize Pending status over Succeeded status', () => {
    const pipelineRuns = [
      createMockPipelineRun(runStatus.Succeeded),
      createMockPipelineRun(runStatus.Pending),
    ];

    expect(getCommitStatusFromPipelineRuns(pipelineRuns)).toBe(runStatus.Pending);
  });

  it('should return first found status when multiple other statuses are present', () => {
    const pipelineRuns = [
      createMockPipelineRun(runStatus.Succeeded),
      createMockPipelineRun(runStatus.Pending),
      createMockPipelineRun(runStatus.Cancelled),
      createMockPipelineRun(runStatus.Unknown),
    ];
    expect(getCommitStatusFromPipelineRuns(pipelineRuns)).toBe(runStatus.Pending);
  });

  it('should return Pending when pipeline runs array is empty', () => {
    expect(getCommitStatusFromPipelineRuns([])).toBe(runStatus.Pending);
  });

  it('should return Pending when pipeline runs have no conditions', () => {
    const pipelineRuns: PipelineRunKind[] = [
      {
        apiVersion: 'tekton.dev/v1',
        kind: 'PipelineRun',
        metadata: {
          name: 'test-1',
          namespace: 'test',
          creationTimestamp: '2024-01-01T00:00:00Z',
        },
        spec: {},
        status: {
          conditions: [],
          pipelineSpec: null,
        },
      },
    ];

    expect(getCommitStatusFromPipelineRuns(pipelineRuns)).toBe(runStatus.Pending);
  });

  it('should handle mixed valid and invalid pipeline runs', () => {
    const pipelineRuns = [
      createMockPipelineRun(runStatus.Succeeded),
      {
        apiVersion: 'tekton.dev/v1',
        kind: 'PipelineRun',
        metadata: {
          name: 'test-invalid',
          namespace: 'test',
          creationTimestamp: '2024-01-01T00:00:00Z',
        },
        spec: {},
        status: {
          conditions: [],
          pipelineSpec: null,
        },
      } as PipelineRunKind,
    ];

    expect(getCommitStatusFromPipelineRuns(pipelineRuns)).toBe(runStatus.Pending);
  });
});

describe('useCommitStatus', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns Pending status if pipelineruns are not loaded', () => {
    usePipelineRunsForCommitMock
      .mockReturnValueOnce([
        [],
        false,
        null,
        undefined,
        { hasNextPage: false, isFetchingNextPage: false },
      ]) // buildPipelineRuns
      .mockReturnValueOnce([
        [],
        false,
        null,
        undefined,
        { hasNextPage: false, isFetchingNextPage: false },
      ]); // testPipelineRuns
    const { result } = renderHook(() => useCommitStatus('app', 'commit'));
    expect(result.current[0]).toBe(runStatus.Pending);
    expect(result.current[1]).toBe(false);
  });

  it('returns Pending status if there is an error', () => {
    const error = new Error('Test error');
    usePipelineRunsForCommitMock
      .mockReturnValueOnce([
        [],
        true,
        error,
        undefined,
        { hasNextPage: false, isFetchingNextPage: false },
      ]) // buildPipelineRuns
      .mockReturnValueOnce([
        [],
        true,
        null,
        undefined,
        { hasNextPage: false, isFetchingNextPage: false },
      ]); // testPipelineRuns
    const { result } = renderHook(() => useCommitStatus('app', 'commit'));
    expect(result.current[0]).toBe(runStatus.Pending);
    expect(result.current[1]).toBe(true);
    expect(result.current[2]).toBe(error);
  });

  it('returns Pending status if pipelineruns for given commit are not found', () => {
    usePipelineRunsForCommitMock
      .mockReturnValueOnce([
        [],
        true,
        null,
        undefined,
        { hasNextPage: false, isFetchingNextPage: false },
      ]) // buildPipelineRuns
      .mockReturnValueOnce([
        [],
        true,
        null,
        undefined,
        { hasNextPage: false, isFetchingNextPage: false },
      ]); // testPipelineRuns
    const { result } = renderHook(() => useCommitStatus('app', 'commit123'));
    expect(result.current[0]).toBe(runStatus.Pending);
    expect(result.current[1]).toBe(true);
  });

  it('returns correct status when both build and test pipeline runs are loaded', () => {
    const buildPLR = pipelineWithCommits.find(
      (p) => p.metadata.labels['pipelinesascode.tekton.dev/sha'] === 'commit123',
    );
    usePipelineRunsForCommitMock
      .mockReturnValueOnce([
        buildPLR ? [buildPLR] : [],
        true,
        null,
        undefined,
        { hasNextPage: false, isFetchingNextPage: false },
      ]) // buildPipelineRuns
      .mockReturnValueOnce([
        [],
        true,
        null,
        undefined,
        { hasNextPage: false, isFetchingNextPage: false },
      ]); // testPipelineRuns
    const { result } = renderHook(() => useCommitStatus('purple-mermaid-app', 'commit123'));
    expect(result.current[0]).toBe(runStatus.Succeeded);
    expect(result.current[1]).toBe(true);
  });

  it('returns Failed when any pipeline run fails', () => {
    const failedPLR = createMockPipelineRun(runStatus.Failed);
    const succeededPLR = createMockPipelineRun(runStatus.Succeeded);
    usePipelineRunsForCommitMock
      .mockReturnValueOnce([
        [succeededPLR],
        true,
        null,
        undefined,
        { hasNextPage: false, isFetchingNextPage: false },
      ]) // buildPipelineRuns
      .mockReturnValueOnce([
        [failedPLR],
        true,
        null,
        undefined,
        { hasNextPage: false, isFetchingNextPage: false },
      ]); // testPipelineRuns
    const { result } = renderHook(() => useCommitStatus('app', 'commit'));
    expect(result.current[0]).toBe(runStatus.Failed);
    expect(result.current[1]).toBe(true);
  });

  it('returns Running when any pipeline run is running', () => {
    const runningPLR = createMockPipelineRun(runStatus.Running);
    const succeededPLR = createMockPipelineRun(runStatus.Succeeded);
    usePipelineRunsForCommitMock
      .mockReturnValueOnce([
        [succeededPLR],
        true,
        null,
        undefined,
        { hasNextPage: false, isFetchingNextPage: false },
      ]) // buildPipelineRuns
      .mockReturnValueOnce([
        [runningPLR],
        true,
        null,
        undefined,
        { hasNextPage: false, isFetchingNextPage: false },
      ]); // testPipelineRuns
    const { result } = renderHook(() => useCommitStatus('app', 'commit'));
    expect(result.current[0]).toBe(runStatus.Running);
    expect(result.current[1]).toBe(true);
  });

  it('returns Succeeded when all pipeline runs are successful', () => {
    const succeededPLR1 = createMockPipelineRun(runStatus.Succeeded);
    const succeededPLR2 = createMockPipelineRun(runStatus.Succeeded);
    usePipelineRunsForCommitMock
      .mockReturnValueOnce([
        [succeededPLR1],
        true,
        null,
        undefined,
        { hasNextPage: false, isFetchingNextPage: false },
      ]) // buildPipelineRuns
      .mockReturnValueOnce([
        [succeededPLR2],
        true,
        null,
        undefined,
        { hasNextPage: false, isFetchingNextPage: false },
      ]); // testPipelineRuns
    const { result } = renderHook(() => useCommitStatus('app', 'commit'));
    expect(result.current[0]).toBe(runStatus.Succeeded);
    expect(result.current[1]).toBe(true);
  });
});
