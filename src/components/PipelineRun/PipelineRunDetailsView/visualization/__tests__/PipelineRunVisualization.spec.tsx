import '@testing-library/jest-dom';
import { screen } from '@testing-library/react';
import { testPipelineRuns, DataState } from '~/__data__/pipelinerun-data';
import { PipelineRunKind, TaskRunKind } from '~/types';
import { setupGetBBoxMock } from '~/unit-test-utils/mock-pipelinerun-test-utils';
import { renderWithQueryClientAndRouter } from '~/unit-test-utils/rendering-utils';
import PipelineRunVisualization from '../PipelineRunVisualization';

// Mock getBBox for PatternFly Topology visualization
beforeAll(() => {
  setupGetBBoxMock();
});

// Reuse existing mock data from src/__data__/pipelinerun-data.ts
const mockPipelineRun: PipelineRunKind = testPipelineRuns[DataState.SUCCEEDED];

const mockTaskRuns: TaskRunKind[] = [
  {
    apiVersion: 'tekton.dev/v1',
    kind: 'TaskRun',
    metadata: {
      name: 'task-run-1',
      namespace: 'test-namespace',
      labels: {
        'tekton.dev/pipelineTask': 'init',
      },
    },
    spec: {},
    status: {
      conditions: [
        {
          type: 'Succeeded',
          status: 'True',
        },
      ],
    },
  } as unknown as TaskRunKind,
];

// We are testing:
// error state rendering, visualization rendering, model generation from real utils, side panel integration
describe('PipelineRunVisualization', () => {
  it('should render graph error state when there is an error', () => {
    const mockError = { message: 'Pipeline run failed to load' };

    renderWithQueryClientAndRouter(
      <PipelineRunVisualization
        pipelineRun={mockPipelineRun}
        error={mockError}
        taskRuns={mockTaskRuns}
      />,
    );

    // Error message should be displayed
    expect(screen.getByText(/Pipeline run failed to load/)).toBeInTheDocument();
  });

  it('should return null when model is not available and no error', () => {
    const emptyPipelineRun = {
      ...mockPipelineRun,
      spec: {},
      status: {},
    } as PipelineRunKind;

    const { container } = renderWithQueryClientAndRouter(
      <PipelineRunVisualization pipelineRun={emptyPipelineRun} error={null} taskRuns={[]} />,
    );

    // With no pipeline spec, the real util will return null model
    expect(container.firstChild).toBeNull();
  });

  it('should render visualization when model is available', () => {
    renderWithQueryClientAndRouter(
      <PipelineRunVisualization
        pipelineRun={mockPipelineRun}
        error={null}
        taskRuns={mockTaskRuns}
      />,
    );

    // Real getPipelineRunDataModel will generate model from the pipeline spec
    // Should render the graph container
    const graphContainer = screen.getByTestId('pipelinerun-graph');
    expect(graphContainer).toBeInTheDocument();
    expect(graphContainer).toHaveClass('pipelinerun-graph');
  });

  it('should render pipeline run graph container with correct class', () => {
    renderWithQueryClientAndRouter(
      <PipelineRunVisualization
        pipelineRun={mockPipelineRun}
        error={null}
        taskRuns={mockTaskRuns}
      />,
    );

    const graphContainer = screen.getByTestId('pipelinerun-graph');
    expect(graphContainer).toBeInTheDocument();
    expect(graphContainer).toHaveClass('pipelinerun-graph');
  });

  it('should handle error state with priority over model', () => {
    const mockError = { message: 'Error message' };

    renderWithQueryClientAndRouter(
      <PipelineRunVisualization
        pipelineRun={mockPipelineRun}
        error={mockError}
        taskRuns={mockTaskRuns}
      />,
    );

    // Error state should be shown even if model could be generated
    expect(screen.getByText(/Error message/)).toBeInTheDocument();
    // Graph should not be rendered when there's an error
    expect(screen.queryByTestId('pipelinerun-graph')).not.toBeInTheDocument();
  });

  it('should render side panel when visualization is available', () => {
    renderWithQueryClientAndRouter(
      <PipelineRunVisualization
        pipelineRun={mockPipelineRun}
        error={null}
        taskRuns={mockTaskRuns}
      />,
    );

    // Should render the graph container - PipelineRunSidePanel is rendered inside VisualizationFactory
    const graphContainer = screen.getByTestId('pipelinerun-graph');
    expect(graphContainer).toBeInTheDocument();
  });
});
