import '@testing-library/jest-dom';
import { screen } from '@testing-library/react';
import { testPipelineRuns, DataState } from '~/__data__/pipelinerun-data';
import { usePipelineRunV2 } from '~/hooks/usePipelineRunsV2';
import { useSearchParam } from '~/hooks/useSearchParam';
import { useTaskRunsForPipelineRuns } from '~/hooks/useTaskRunsV2';
import { PipelineRunKind, TaskRunKind } from '~/types';
import { mockUseNamespaceHook } from '~/unit-test-utils/mock-namespace';
import {
  createPipelineRunMockStates,
  createTaskRunsMockStates,
  setupGetBBoxMock,
} from '~/unit-test-utils/mock-pipelinerun-test-utils';
import { createUseParamsMock, routerRenderer } from '~/unit-test-utils/mock-react-router';
import PipelineRunLogsTab from '../PipelineRunLogsTab';

// Reuse existing mock data with customization
const mockPipelineRun = {
  ...testPipelineRuns[DataState.SUCCEEDED],
  metadata: {
    ...testPipelineRuns[DataState.SUCCEEDED].metadata,
    name: 'test-pipeline-run',
    namespace: 'test-namespace',
  },
} as PipelineRunKind;

const mockTaskRuns = [
  {
    metadata: {
      name: 'task-run-1',
    },
  },
] as TaskRunKind[];

const mockSetActiveTask = jest.fn();
const mockUnsetActiveTask = jest.fn();

jest.mock('~/hooks/usePipelineRunsV2', () => ({
  usePipelineRunV2: jest.fn(),
  usePipelineRunsV2: jest.fn(() => [[], true, undefined, jest.fn(), {}]),
}));
jest.mock('~/hooks/useTaskRunsV2', () => ({
  useTaskRunsForPipelineRuns: jest.fn(),
}));
jest.mock('~/hooks/useSearchParam', () => ({
  useSearchParam: jest.fn(),
}));

const mockUsePipelineRunV2 = usePipelineRunV2 as jest.Mock;
const mockUseTaskRunsForPipelineRuns = useTaskRunsForPipelineRuns as jest.Mock;
const mockUseSearchParam = useSearchParam as jest.Mock;

// Shared mock state helpers
const mockPipelineRunStates = createPipelineRunMockStates();
const mockTaskRunsStates = createTaskRunsMockStates();

describe('PipelineRunLogsTab', () => {
  const mockNamespace = 'test-namespace';
  const mockPipelineRunName = 'test-pipeline-run';

  const useNamespaceMock = mockUseNamespaceHook(mockNamespace);

  const useParamsMock = createUseParamsMock();

  // Mock getBBox for PatternFly Topology visualization
  beforeAll(() => {
    setupGetBBoxMock();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    useNamespaceMock.mockReturnValue(mockNamespace);
    useParamsMock.mockReturnValue({ pipelineRunName: mockPipelineRunName });
    mockUseSearchParam.mockReturnValue([undefined, mockSetActiveTask, mockUnsetActiveTask]);
  });

  it('should render spinner when loading pipeline run data', () => {
    mockUsePipelineRunV2.mockReturnValue(mockPipelineRunStates.loading());
    mockUseTaskRunsForPipelineRuns.mockReturnValue(mockTaskRunsStates.loaded([]));

    routerRenderer(<PipelineRunLogsTab />);

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    expect(screen.queryByTestId('logs-tasklist')).not.toBeInTheDocument();
  });

  it('should render spinner when loading task runs', () => {
    mockUsePipelineRunV2.mockReturnValue(mockPipelineRunStates.loaded(mockPipelineRun));
    mockUseTaskRunsForPipelineRuns.mockReturnValue(mockTaskRunsStates.loading());

    routerRenderer(<PipelineRunLogsTab />);

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    expect(screen.queryByTestId('logs-tasklist')).not.toBeInTheDocument();
  });

  it('should call hooks with correct parameters', () => {
    mockUsePipelineRunV2.mockReturnValue(mockPipelineRunStates.loaded(mockPipelineRun));
    mockUseTaskRunsForPipelineRuns.mockReturnValue(mockTaskRunsStates.loaded(mockTaskRuns));

    routerRenderer(<PipelineRunLogsTab />);

    expect(mockUsePipelineRunV2).toHaveBeenCalledWith(mockNamespace, mockPipelineRunName);
    expect(mockUseTaskRunsForPipelineRuns).toHaveBeenCalledWith(mockNamespace, mockPipelineRunName);
    expect(mockUseSearchParam).toHaveBeenCalledWith('task', undefined);
  });

  it('should render PipelineRunLogs when data is loaded', () => {
    mockUsePipelineRunV2.mockReturnValue(mockPipelineRunStates.loaded(mockPipelineRun));
    mockUseTaskRunsForPipelineRuns.mockReturnValue(mockTaskRunsStates.loaded(mockTaskRuns));

    routerRenderer(<PipelineRunLogsTab />);

    expect(screen.getByTestId('logs-tasklist')).toBeInTheDocument();
  });

  it('should render error state when pipeline run fails to load', () => {
    const mockError = { message: 'Pipeline run not found', code: 404 };
    mockUsePipelineRunV2.mockReturnValue([null, true, mockError]);
    mockUseTaskRunsForPipelineRuns.mockReturnValue([
      [],
      true,
      undefined,
      jest.fn(),
      { hasNextPage: false, isFetchingNextPage: false },
    ]);

    routerRenderer(<PipelineRunLogsTab />);

    expect(screen.getByText('404: Page not found')).toBeInTheDocument();
    expect(screen.queryByTestId('logs-tasklist')).not.toBeInTheDocument();
  });

  it('should render error state when task runs fail to load', () => {
    const mockError = { message: 'Internal Server Error', code: 500 };
    mockUsePipelineRunV2.mockReturnValue([mockPipelineRun, true, undefined]);
    mockUseTaskRunsForPipelineRuns.mockReturnValue([
      null,
      true,
      mockError,
      jest.fn(),
      { hasNextPage: false, isFetchingNextPage: false },
    ]);

    routerRenderer(<PipelineRunLogsTab />);

    expect(screen.getByText('Unable to load task runs')).toBeInTheDocument();
    expect(screen.getByText('Internal Server Error')).toBeInTheDocument();
    expect(screen.queryByTestId('logs-tasklist')).not.toBeInTheDocument();
  });

  it('should call useSearchParam hook with task parameter', () => {
    mockUsePipelineRunV2.mockReturnValue([mockPipelineRun, true, undefined]);
    mockUseTaskRunsForPipelineRuns.mockReturnValue([
      mockTaskRuns,
      true,
      undefined,
      jest.fn(),
      { hasNextPage: false, isFetchingNextPage: false },
    ]);

    routerRenderer(<PipelineRunLogsTab />);

    expect(mockUseSearchParam).toHaveBeenCalledWith('task', undefined);
  });
});
