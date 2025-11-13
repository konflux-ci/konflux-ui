import '@testing-library/jest-dom';
import { screen } from '@testing-library/react';
import { useTaskRunsForPipelineRuns } from '~/hooks/useTaskRunsV2';
import { TaskRunKind } from '~/types';
import { mockUseNamespaceHook } from '~/unit-test-utils/mock-namespace';
import { createTaskRunsMockStates } from '~/unit-test-utils/mock-pipelinerun-test-utils';
import { createUseParamsMock, routerRenderer } from '~/unit-test-utils/mock-react-router';
import PipelineRunTaskRunsTab from '../PipelineRunTaskRunsTab';

jest.mock('~/hooks/useTaskRunsV2', () => ({
  useTaskRunsForPipelineRuns: jest.fn(),
}));

const mockUseTaskRunsForPipelineRuns = useTaskRunsForPipelineRuns as jest.Mock;

// Shared mock state helpers
const mockTaskRunsStates = createTaskRunsMockStates();

describe('PipelineRunTaskRunsTab', () => {
  const mockNamespace = 'test-namespace';
  const mockPipelineRunName = 'test-pipeline-run-123';

  const useNamespaceMock = mockUseNamespaceHook(mockNamespace);
  const useParamsMock = createUseParamsMock();

  beforeEach(() => {
    jest.clearAllMocks();
    useNamespaceMock.mockReturnValue(mockNamespace);
    useParamsMock.mockReturnValue({ pipelineRunName: mockPipelineRunName });
  });

  it('should render loading spinner when task runs are loading', () => {
    mockUseTaskRunsForPipelineRuns.mockReturnValue(mockTaskRunsStates.loading());

    routerRenderer(<PipelineRunTaskRunsTab />);

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('should call useTaskRunsForPipelineRuns with correct parameters', () => {
    mockUseTaskRunsForPipelineRuns.mockReturnValue(mockTaskRunsStates.loaded([]));

    routerRenderer(<PipelineRunTaskRunsTab />);

    expect(mockUseTaskRunsForPipelineRuns).toHaveBeenCalledWith(
      mockNamespace,
      mockPipelineRunName,
      undefined,
    );
  });

  it('should render empty state when there are no task runs', () => {
    mockUseTaskRunsForPipelineRuns.mockReturnValue(mockTaskRunsStates.loaded([]));

    routerRenderer(<PipelineRunTaskRunsTab />);

    expect(screen.getByTestId('taskrun-empty-state')).toBeInTheDocument();
    expect(screen.getByText('No task runs found')).toBeInTheDocument();
  });

  it('should render task runs when data is loaded', () => {
    const mockTaskRuns = [
      {
        metadata: { name: 'task-run-1', namespace: mockNamespace },
        spec: { taskRef: { name: 'task-1' } },
      },
    ] as TaskRunKind[];

    mockUseTaskRunsForPipelineRuns.mockReturnValue(mockTaskRunsStates.loaded(mockTaskRuns));

    routerRenderer(<PipelineRunTaskRunsTab />);

    expect(screen.getByTestId('taskrun-list-toolbar')).toBeInTheDocument();
  });
});
