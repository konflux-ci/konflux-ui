
import '@testing-library/jest-dom';
import { screen } from '@testing-library/react';
import { PipelineRunKind, TaskRunKind } from '~/types';
import { renderWithQueryClientAndRouter } from '~/unit-test-utils/rendering-utils';
import PipelineRunVisualization from '../PipelineRunVisualization';

jest.mock('../../../../topology/factories', () => {
  const actual = jest.requireActual('../../../../topology/factories');
  return {
    ...actual,
    layoutFactory: jest.fn(),
    // Mock VisualizationFactory to avoid SVG rendering issues in jsdom
    // The real component provides visualization context but we just render children
    VisualizationFactory: ({ children }: { children: React.ReactNode }) => (
      <div data-test="visualization-factory">
        {children}
      </div>
    ),
  };
});

// Mock PipelineRunSidePanel as it depends on visualization context from VisualizationFactory
jest.mock('../../PipelineRunSidePanel', () => ({
  __esModule: true,
  default: () => <div data-test="pipeline-run-side-panel">PipelineRunSidePanel</div>,
}));

const mockPipelineRun: PipelineRunKind = {
  apiVersion: 'tekton.dev/v1',
  kind: 'PipelineRun',
  metadata: {
    name: 'test-pipeline-run',
    namespace: 'test-namespace',
  },
  spec: {
    pipelineSpec: {
      tasks: [
        {
          name: 'build',
          taskRef: {
            name: 'buildah',
          },
        },
      ],
    },
  },
  status: {
    pipelineSpec: {
      tasks: [
        {
          name: 'build',
          taskRef: {
            name: 'buildah',
          },
        },
      ],
    },
  },
} as unknown as PipelineRunKind;

const mockTaskRuns: TaskRunKind[] = [
  {
    apiVersion: 'tekton.dev/v1',
    kind: 'TaskRun',
    metadata: {
      name: 'task-run-1',
      namespace: 'test-namespace',
      labels: {
        'tekton.dev/pipelineTask': 'build',
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
      <PipelineRunVisualization
        pipelineRun={emptyPipelineRun}
        error={null}
        taskRuns={[]}
      />,
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
    // Should render the graph container and visualization factory
    const graphContainer = screen.getByTestId('pipelinerun-graph');
    expect(graphContainer).toBeInTheDocument();
    expect(screen.getByTestId('visualization-factory')).toBeInTheDocument();
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

    // Should render both visualization and side panel
    expect(screen.getByTestId('visualization-factory')).toBeInTheDocument();
    expect(screen.getByTestId('pipeline-run-side-panel')).toBeInTheDocument();
  });
});
