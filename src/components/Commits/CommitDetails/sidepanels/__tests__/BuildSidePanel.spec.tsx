import '@testing-library/jest-dom';
import { ElementModel, GraphElement } from '@patternfly/react-topology';
import { render, screen } from '@testing-library/react';
import { PipelineRunLabel, runStatus } from '~/consts/pipelinerun';
import { useTaskRunsForPipelineRuns } from '~/hooks/useTaskRunsV2';
import { PipelineRunKind } from '~/types';
import { mockUseNamespaceHook } from '../../../../../unit-test-utils';
import {
  CommitWorkflowNodeModelData,
  CommitWorkflowNodeType,
} from '../../visualization/commit-visualization-types';
import BuildSidePanel from '../BuildSidePanel';

jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');
  return {
    ...actual,
    Link: (props) => <a href={props.to}>{props.children}</a>,
  };
});

jest.mock('~/hooks/useTaskRunsV2', () => ({
  useTaskRunsForPipelineRuns: jest.fn(),
}));

const mockUseTaskRunsForPipelineRuns = useTaskRunsForPipelineRuns as jest.Mock;

describe('BuildSidePanel', () => {
  const mockNamespace = 'test-namespace';
  const mockApplication = 'test-app';
  const mockPipelineRunName = 'test-pipeline-run';
  const mockOnClose = jest.fn();

  const createMockPipelineRun = (overrides?: Partial<PipelineRunKind>): PipelineRunKind => {
    return {
      apiVersion: 'tekton.dev/v1beta1',
      kind: 'PipelineRun',
      metadata: {
        name: mockPipelineRunName,
        namespace: mockNamespace,
        creationTimestamp: '2024-01-01T00:00:00Z',
        labels: {
          [PipelineRunLabel.APPLICATION]: mockApplication,
          [PipelineRunLabel.COMPONENT]: 'test-component',
          [PipelineRunLabel.PIPELINE_NAME]: 'test-pipeline',
        },
      },
      spec: {},
      status: {
        startTime: '2024-01-01T00:00:00Z',
        completionTime: '2024-01-01T00:05:00Z',
      },
      ...overrides,
    } as PipelineRunKind;
  };

  const createMockWorkflowNode = (
    pipelineRun: PipelineRunKind,
    status: runStatus = runStatus.Succeeded,
  ): GraphElement<ElementModel, CommitWorkflowNodeModelData> => {
    const workflowData: CommitWorkflowNodeModelData = {
      workflowType: CommitWorkflowNodeType.BUILD,
      status,
      application: mockApplication,
      resource: pipelineRun,
    };

    return {
      getData: jest.fn(() => workflowData),
      getLabel: jest.fn(() => mockPipelineRunName),
    } as unknown as GraphElement<ElementModel, CommitWorkflowNodeModelData>;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseNamespaceHook(mockNamespace);
    mockUseTaskRunsForPipelineRuns.mockReturnValue([[], true, null]);
  });

  describe('Basic Rendering', () => {
    it('should render the component with pipeline run data', () => {
      const pipelineRun = createMockPipelineRun();
      const workflowNode = createMockWorkflowNode(pipelineRun);

      render(<BuildSidePanel workflowNode={workflowNode} onClose={mockOnClose} />);

      expect(screen.getByTestId('build-side-panel-head')).toBeInTheDocument();
      expect(screen.getByTestId('build-side-panel-body')).toBeInTheDocument();
      expect(screen.getByText(mockPipelineRunName)).toBeInTheDocument();
      expect(screen.getByText('Pipeline run')).toBeInTheDocument();
    });

    it('should render null when pipeline run is not available', () => {
      const workflowData: CommitWorkflowNodeModelData = {
        workflowType: CommitWorkflowNodeType.BUILD,
        status: runStatus.Succeeded,
        application: mockApplication,
        resource: undefined,
      };

      const workflowNode = {
        getData: jest.fn(() => workflowData),
      } as unknown as GraphElement<ElementModel, CommitWorkflowNodeModelData>;

      const { container } = render(
        <BuildSidePanel workflowNode={workflowNode} onClose={mockOnClose} />,
      );

      expect(container.firstChild).toBeNull();
    });

    it('should render pipeline run details', () => {
      const pipelineRun = createMockPipelineRun();
      const workflowNode = createMockWorkflowNode(pipelineRun);

      render(<BuildSidePanel workflowNode={workflowNode} onClose={mockOnClose} />);

      expect(screen.getByText('Created at')).toBeInTheDocument();
      expect(screen.getByText('Duration')).toBeInTheDocument();
      expect(screen.getByText('Type')).toBeInTheDocument();
      expect(screen.getByText('Build')).toBeInTheDocument();
      expect(screen.getByText('Pipeline')).toBeInTheDocument();
      expect(screen.getByText('test-pipeline')).toBeInTheDocument();
    });

    it('should render component link when component and application labels are present', () => {
      const pipelineRun = createMockPipelineRun();
      const workflowNode = createMockWorkflowNode(pipelineRun);

      render(<BuildSidePanel workflowNode={workflowNode} onClose={mockOnClose} />);

      const componentLink = screen.getByRole('link', { name: 'test-component' });
      expect(componentLink).toBeInTheDocument();
      expect(componentLink).toHaveAttribute(
        'href',
        `/ns/${mockNamespace}/applications/${mockApplication}/components/test-component`,
      );
    });

    it('should render component name as text when application label is missing', () => {
      const pipelineRun = createMockPipelineRun({
        metadata: {
          name: mockPipelineRunName,
          namespace: mockNamespace,
          creationTimestamp: '2024-01-01T00:00:00Z',
          labels: {
            [PipelineRunLabel.COMPONENT]: 'test-component',
            [PipelineRunLabel.PIPELINE_NAME]: 'test-pipeline',
          },
        },
      });
      const workflowNode = createMockWorkflowNode(pipelineRun);

      render(<BuildSidePanel workflowNode={workflowNode} onClose={mockOnClose} />);

      expect(screen.getByText('test-component')).toBeInTheDocument();
      expect(screen.queryByRole('link', { name: 'test-component' })).not.toBeInTheDocument();
    });

    it('should render dash when component label is missing', () => {
      const pipelineRun = createMockPipelineRun({
        metadata: {
          name: mockPipelineRunName,
          namespace: mockNamespace,
          creationTimestamp: '2024-01-01T00:00:00Z',
          labels: {
            [PipelineRunLabel.APPLICATION]: mockApplication,
            [PipelineRunLabel.PIPELINE_NAME]: 'test-pipeline',
          },
        },
      });
      const workflowNode = createMockWorkflowNode(pipelineRun);

      render(<BuildSidePanel workflowNode={workflowNode} onClose={mockOnClose} />);

      expect(screen.getByText('-')).toBeInTheDocument();
    });

    it('should render view logs link', () => {
      const pipelineRun = createMockPipelineRun();
      const workflowNode = createMockWorkflowNode(pipelineRun);

      render(<BuildSidePanel workflowNode={workflowNode} onClose={mockOnClose} />);

      const logsLink = screen.getByRole('link', { name: 'View logs' });
      expect(logsLink).toBeInTheDocument();
      expect(logsLink).toHaveAttribute(
        'href',
        `/ns/${mockNamespace}/applications/${mockApplication}/pipelineruns/${mockPipelineRunName}/logs`,
      );
    });
  });

  describe('RunResultsList', () => {
    it('should render RunResultsList when results are available', () => {
      const pipelineRun = createMockPipelineRun({
        apiVersion: 'tekton.dev/v1beta1',
        status: {
          startTime: '2024-01-01T00:00:00Z',
          completionTime: '2024-01-01T00:05:00Z',
          pipelineResults: [
            { name: 'result1', value: 'value1' },
            { name: 'result2', value: 'value2' },
          ],
          pipelineSpec: {
            tasks: [],
          },
        },
      });
      const workflowNode = createMockWorkflowNode(pipelineRun);

      render(<BuildSidePanel workflowNode={workflowNode} onClose={mockOnClose} />);

      expect(screen.getByText('Results')).toBeInTheDocument();
      expect(screen.getByText('result1')).toBeInTheDocument();
      expect(screen.getByText('value1')).toBeInTheDocument();
    });

    it('should render RunResultsList when results are available (v1 API)', () => {
      const pipelineRun = createMockPipelineRun({
        apiVersion: 'tekton.dev/v1',
        status: {
          startTime: '2024-01-01T00:00:00Z',
          completionTime: '2024-01-01T00:05:00Z',
          results: [{ name: 'result1', value: 'value1' }],
          pipelineSpec: {
            tasks: [],
          },
        },
      });
      const workflowNode = createMockWorkflowNode(pipelineRun);

      render(<BuildSidePanel workflowNode={workflowNode} onClose={mockOnClose} />);

      expect(screen.getByText('Results')).toBeInTheDocument();
      expect(screen.getByText('result1')).toBeInTheDocument();
      expect(screen.getByText('value1')).toBeInTheDocument();
    });

    it('should not render RunResultsList when results are not available', () => {
      const pipelineRun = createMockPipelineRun({
        status: {
          startTime: '2024-01-01T00:00:00Z',
          completionTime: '2024-01-01T00:05:00Z',
          pipelineSpec: {
            tasks: [],
          },
        },
      });
      const workflowNode = createMockWorkflowNode(pipelineRun);

      render(<BuildSidePanel workflowNode={workflowNode} onClose={mockOnClose} />);

      expect(screen.queryByText('Results')).not.toBeInTheDocument();
    });
  });

  describe('RunParamsList', () => {
    it('should render RunParamsList when spec params are available', () => {
      const pipelineRun = createMockPipelineRun({
        spec: {
          params: [
            { name: 'param1', value: 'value1' },
            { name: 'param2', value: 'value2' },
          ],
        },
      });
      const workflowNode = createMockWorkflowNode(pipelineRun);

      render(<BuildSidePanel workflowNode={workflowNode} onClose={mockOnClose} />);

      expect(screen.getByTestId('run-params-list')).toBeInTheDocument();
      expect(screen.getByText('Parameters')).toBeInTheDocument();
      expect(screen.getByText('param1')).toBeInTheDocument();
      expect(screen.getByText('value1')).toBeInTheDocument();
    });

    it('should not render RunParamsList when spec params are not available', () => {
      const pipelineRun = createMockPipelineRun({
        spec: {
          params: undefined,
        },
      });
      const workflowNode = createMockWorkflowNode(pipelineRun);

      render(<BuildSidePanel workflowNode={workflowNode} onClose={mockOnClose} />);

      expect(screen.queryByTestId('run-params-list')).not.toBeInTheDocument();
    });

    it('should not render RunParamsList when spec params array is empty', () => {
      const pipelineRun = createMockPipelineRun({
        spec: {
          params: [],
        },
      });
      const workflowNode = createMockWorkflowNode(pipelineRun);

      render(<BuildSidePanel workflowNode={workflowNode} onClose={mockOnClose} />);

      expect(screen.queryByTestId('run-params-list')).not.toBeInTheDocument();
    });
  });

  describe('Task Runs', () => {
    it('should call useTaskRunsForPipelineRuns with correct parameters', () => {
      const pipelineRun = createMockPipelineRun();
      const workflowNode = createMockWorkflowNode(pipelineRun);

      render(<BuildSidePanel workflowNode={workflowNode} onClose={mockOnClose} />);

      expect(mockUseTaskRunsForPipelineRuns).toHaveBeenCalledWith(
        mockNamespace,
        mockPipelineRunName,
      );
    });

    it('should render ScanDescriptionListGroup when task runs are loaded', () => {
      const mockTaskRuns = [
        {
          apiVersion: 'tekton.dev/v1',
          metadata: { name: 'task-run-1' },
        },
      ];
      mockUseTaskRunsForPipelineRuns.mockReturnValue([mockTaskRuns, true, null]);

      const pipelineRun = createMockPipelineRun();
      const workflowNode = createMockWorkflowNode(pipelineRun);

      render(<BuildSidePanel workflowNode={workflowNode} onClose={mockOnClose} />);

      expect(screen.getByTestId('build-side-panel-body')).toBeInTheDocument();
    });
  });

  describe('Links', () => {
    it('should render pipeline run details link', () => {
      const pipelineRun = createMockPipelineRun();
      const workflowNode = createMockWorkflowNode(pipelineRun);

      render(<BuildSidePanel workflowNode={workflowNode} onClose={mockOnClose} />);

      const pipelineRunLink = screen.getByRole('link', { name: mockPipelineRunName });
      expect(pipelineRunLink).toBeInTheDocument();
      expect(pipelineRunLink).toHaveAttribute(
        'href',
        `/ns/${mockNamespace}/applications/${mockApplication}/pipelineruns/${mockPipelineRunName}`,
      );
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing creation timestamp', () => {
      const pipelineRun = createMockPipelineRun({
        metadata: {
          name: mockPipelineRunName,
          namespace: mockNamespace,
          labels: {
            [PipelineRunLabel.APPLICATION]: mockApplication,
            [PipelineRunLabel.COMPONENT]: 'test-component',
            [PipelineRunLabel.PIPELINE_NAME]: 'test-pipeline',
          },
        },
      });
      const workflowNode = createMockWorkflowNode(pipelineRun);

      render(<BuildSidePanel workflowNode={workflowNode} onClose={mockOnClose} />);

      expect(screen.getByText('Created at')).toBeInTheDocument();
    });

    it('should handle missing duration (no startTime or completionTime)', () => {
      const pipelineRun = createMockPipelineRun({
        status: {
          pipelineSpec: {
            tasks: [],
          },
        },
      });
      const workflowNode = createMockWorkflowNode(pipelineRun);

      render(<BuildSidePanel workflowNode={workflowNode} onClose={mockOnClose} />);

      expect(screen.getByText('Duration')).toBeInTheDocument();
      expect(screen.getByText('less than a second')).toBeInTheDocument();
    });

    it('should handle different pipeline statuses', () => {
      const pipelineRun = createMockPipelineRun();
      const workflowNode = createMockWorkflowNode(pipelineRun, runStatus.Failed);

      render(<BuildSidePanel workflowNode={workflowNode} onClose={mockOnClose} />);

      expect(screen.getByTestId('build-side-panel-head')).toBeInTheDocument();
      expect(screen.getByText(mockPipelineRunName)).toBeInTheDocument();
    });
  });
});
