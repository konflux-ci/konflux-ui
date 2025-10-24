import '@testing-library/jest-dom';
import { screen } from '@testing-library/react';
import { PipelineRunLabel } from '~/consts/pipelinerun';
import { usePipelineRunV2 } from '~/hooks/usePipelineRunsV2';
import { useTaskRunsForPipelineRuns } from '~/hooks/useTaskRunsV2';
import { PipelineRunKind, TaskRunKind } from '~/types';
import { mockUseNamespaceHook } from '~/unit-test-utils/mock-namespace';
import { createUseParamsMock } from '~/unit-test-utils/mock-react-router';
import { renderWithQueryClientAndRouter } from '~/unit-test-utils/rendering-utils';
import PipelineRunDetailsTab from '../PipelineRunDetailsTab';

const mockPipelineRun = {
  apiVersion: 'tekton.dev/v1',
  kind: 'PipelineRun',
  metadata: {
    name: 'test-pipeline-run',
    namespace: 'test-namespace',
    creationTimestamp: '2024-01-01T00:00:00Z',
    labels: {
      [PipelineRunLabel.APPLICATION]: 'test-app',
      [PipelineRunLabel.COMPONENT]: 'test-component',
      [PipelineRunLabel.PIPELINE_NAME]: 'test-pipeline',
    },
    annotations: {},
  },
  spec: {},
  status: {
    startTime: '2024-01-01T00:00:00Z',
    completionTime: '2024-01-01T00:05:00Z',
    conditions: [
      {
        type: 'Succeeded',
        status: 'True',
        reason: 'Completed',
      },
    ],
  },
} as unknown as PipelineRunKind;

const mockTaskRuns: TaskRunKind[] = [];

// PipelineRunVisualization has its own tests. We mock it to focus on testing
// PipelineRunDetailsTab's logic: loading data and displaying details.
jest.mock('../../visualization/PipelineRunVisualization', () => ({
  __esModule: true,
  default: jest.fn(() => (
    <div data-test="pipeline-run-visualization">PipelineRunVisualization</div>
  )),
}));

jest.mock('../../../../../hooks/usePipelineRunsV2', () => ({
  usePipelineRunV2: jest.fn(),
  usePipelineRunsV2: jest.fn(() => [[], true, undefined, jest.fn(), {}]),
}));
jest.mock('../../../../../hooks/useTaskRunsV2');

const mockUsePipelineRunV2 = jest.mocked(usePipelineRunV2);
const mockUseTaskRunsForPipelineRuns = jest.mocked(useTaskRunsForPipelineRuns);

describe('PipelineRunDetailsTab', () => {
  const mockNamespace = 'test-namespace';
  const mockPipelineRunName = 'test-pipeline-run';

  const useNamespaceMock = mockUseNamespaceHook(mockNamespace);
  const useParamsMock = createUseParamsMock();

  beforeEach(() => {
    jest.clearAllMocks();
    useNamespaceMock.mockReturnValue(mockNamespace);
    useParamsMock.mockReturnValue({ pipelineRunName: mockPipelineRunName });
  });

  it('should render spinner when loading pipeline run', () => {
    mockUsePipelineRunV2.mockReturnValue([null, false, undefined]);
    mockUseTaskRunsForPipelineRuns.mockReturnValue([[], true, undefined]);

    renderWithQueryClientAndRouter(<PipelineRunDetailsTab />);

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('should render spinner when loading task runs', () => {
    mockUsePipelineRunV2.mockReturnValue([mockPipelineRun, true, undefined]);
    mockUseTaskRunsForPipelineRuns.mockReturnValue([[], false, undefined]);

    renderWithQueryClientAndRouter(<PipelineRunDetailsTab />);

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('should call hooks with correct parameters', () => {
    mockUsePipelineRunV2.mockReturnValue([mockPipelineRun, true, undefined]);
    mockUseTaskRunsForPipelineRuns.mockReturnValue([mockTaskRuns, true, undefined]);

    renderWithQueryClientAndRouter(<PipelineRunDetailsTab />);

    expect(mockUsePipelineRunV2).toHaveBeenCalledWith(mockNamespace, mockPipelineRunName);
    expect(mockUseTaskRunsForPipelineRuns).toHaveBeenCalledWith(mockNamespace, mockPipelineRunName);
  });

  it('should render error state when pipeline run fails to load', () => {
    const mockError = { message: 'Pipeline run not found', code: 404 };
    mockUsePipelineRunV2.mockReturnValue([null, true, mockError]);
    mockUseTaskRunsForPipelineRuns.mockReturnValue([mockTaskRuns, true, undefined]);

    renderWithQueryClientAndRouter(<PipelineRunDetailsTab />);

    expect(screen.getByText('404: Page not found')).toBeInTheDocument();
  });

  it('should render PipelineRunVisualization when data is loaded', () => {
    mockUsePipelineRunV2.mockReturnValue([mockPipelineRun, true, undefined]);
    mockUseTaskRunsForPipelineRuns.mockReturnValue([mockTaskRuns, true, undefined]);

    renderWithQueryClientAndRouter(<PipelineRunDetailsTab />);

    expect(screen.getByTestId('pipeline-run-visualization')).toBeInTheDocument();
  });

  it('should render error state when task runs fail to load', () => {
    const mockError = { message: 'Task runs error', code: 500 };
    mockUsePipelineRunV2.mockReturnValue([mockPipelineRun, true, undefined]);
    mockUseTaskRunsForPipelineRuns.mockReturnValue([null, true, mockError]);

    renderWithQueryClientAndRouter(<PipelineRunDetailsTab />);

    // Should still render the page but show error instead of visualization
    expect(screen.getByText(/Unable to load task runs/i)).toBeInTheDocument();
    expect(screen.queryByTestId('pipeline-run-visualization')).not.toBeInTheDocument();
  });

  it('should render pipeline run details when loaded', () => {
    mockUsePipelineRunV2.mockReturnValue([mockPipelineRun, true, undefined]);
    mockUseTaskRunsForPipelineRuns.mockReturnValue([mockTaskRuns, true, undefined]);

    renderWithQueryClientAndRouter(<PipelineRunDetailsTab />);

    expect(screen.getByText('Pipeline run details')).toBeInTheDocument();
    expect(screen.getByText('test-pipeline-run')).toBeInTheDocument();
    expect(screen.getByText('test-namespace')).toBeInTheDocument();
  });

  it('should display pipeline name', () => {
    mockUsePipelineRunV2.mockReturnValue([mockPipelineRun, true, undefined]);
    mockUseTaskRunsForPipelineRuns.mockReturnValue([mockTaskRuns, true, undefined]);

    renderWithQueryClientAndRouter(<PipelineRunDetailsTab />);

    expect(screen.getByText('test-pipeline')).toBeInTheDocument();
  });

  it('should display application name with link', () => {
    mockUsePipelineRunV2.mockReturnValue([mockPipelineRun, true, undefined]);
    mockUseTaskRunsForPipelineRuns.mockReturnValue([mockTaskRuns, true, undefined]);

    renderWithQueryClientAndRouter(<PipelineRunDetailsTab />);

    const appLink = screen.getByRole('link', { name: 'test-app' });
    expect(appLink).toBeInTheDocument();
  });

  it('should display component name with link', () => {
    mockUsePipelineRunV2.mockReturnValue([mockPipelineRun, true, undefined]);
    mockUseTaskRunsForPipelineRuns.mockReturnValue([mockTaskRuns, true, undefined]);

    renderWithQueryClientAndRouter(<PipelineRunDetailsTab />);

    const componentLink = screen.getByRole('link', { name: 'test-component' });
    expect(componentLink).toBeInTheDocument();
  });

  it('should display calculated duration', () => {
    mockUsePipelineRunV2.mockReturnValue([mockPipelineRun, true, undefined]);
    mockUseTaskRunsForPipelineRuns.mockReturnValue([mockTaskRuns, true, undefined]);

    renderWithQueryClientAndRouter(<PipelineRunDetailsTab />);

    // The real calculateDuration utility will calculate the duration from start/completion times
    // We just verify that some duration text is displayed
    expect(screen.getByText(/Duration/i)).toBeInTheDocument();
  });
});
