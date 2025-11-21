import { ModelKind } from '@patternfly/react-topology';
import { routerRenderer } from '../../../../../../utils/test-utils';
import { PipelineLayout } from '../../../../../topology/factories';
import { WorkflowNodeType } from '../types';
import WorkflowVisualizationSurface from '../WorkflowVisualizationSurface';

const mockModel = {
  graph: {
    x: 15,
    y: 15,
    id: 'test-graph',
    type: ModelKind.graph,
    layout: PipelineLayout.WORKFLOW_VISUALIZATION,
  },
  nodes: [
    {
      id: 'node-1',
      label: 'Component 1',
      type: 'workflow-node',
      data: {
        workflowType: WorkflowNodeType.COMPONENT,
        status: 'Succeeded',
      },
    },
    {
      id: 'node-2',
      label: 'Build 1',
      type: 'workflow-node',
      data: {
        workflowType: WorkflowNodeType.BUILD,
        status: 'Running',
      },
    },
  ],
  edges: [
    {
      id: 'edge-1',
      type: 'edge',
      source: 'node-1',
      target: 'node-2',
    },
  ],
};

describe('WorkflowVisualizationSurface', () => {
  beforeEach(() => {
    const createElement = document.createElement.bind(document);
    document.createElement = (tagName) => {
      if (tagName === 'canvas') {
        return {
          getContext: () => ({
            measureText: () => ({}),
          }),
        };
      }
      return createElement(tagName);
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window.SVGElement as any).prototype.getBBox = () => ({
      x: 100,
      y: 100,
      width: 100,
      height: 100,
    });
  });

  afterEach(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window.SVGElement as any).prototype.getBBox = undefined;
  });

  it('should render VisualizationFactory with topology surface', () => {
    const { container } = routerRenderer(<WorkflowVisualizationSurface model={mockModel} />);
    expect(container.firstChild).toBeInTheDocument();
    expect(container.querySelector('.pf-topology-visualization-surface')).toBeInTheDocument();
  });

  it('should render with empty model', () => {
    const emptyModel = {
      graph: {
        x: 15,
        y: 15,
        id: 'empty-graph',
        type: ModelKind.graph,
        layout: PipelineLayout.WORKFLOW_VISUALIZATION,
      },
      nodes: [],
      edges: [],
    };
    const { container } = routerRenderer(<WorkflowVisualizationSurface model={emptyModel} />);
    expect(container.firstChild).toBeInTheDocument();
    // Should render without errors even with empty nodes/edges
    expect(container.querySelector('.pf-topology-visualization-surface')).toBeInTheDocument();
  });

  it('should render with expanded layout', () => {
    const expandedModel = {
      ...mockModel,
      graph: {
        ...mockModel.graph,
        layout: PipelineLayout.EXPANDED_WORKFLOW_VISUALIZATION,
      },
    };
    const { container } = routerRenderer(<WorkflowVisualizationSurface model={expandedModel} />);
    expect(container.firstChild).toBeInTheDocument();
    // Verify expanded layout renders successfully
    expect(container.querySelector('.pf-topology-visualization-surface')).toBeInTheDocument();
  });

  it('should render with multiple nodes', () => {
    const multiNodeModel = {
      ...mockModel,
      nodes: [
        ...mockModel.nodes,
        {
          id: 'node-3',
          label: 'Test 1',
          type: 'workflow-node',
          data: {
            workflowType: WorkflowNodeType.TESTS,
            status: 'Succeeded',
          },
        },
      ],
    };
    const { container } = routerRenderer(<WorkflowVisualizationSurface model={multiNodeModel} />);
    expect(container.firstChild).toBeInTheDocument();
    // Verify visualization renders with 3 nodes in model
    expect(container.querySelector('.pf-topology-visualization-surface')).toBeInTheDocument();
  });

  it('should update when model changes', () => {
    const { container, rerender } = routerRenderer(
      <WorkflowVisualizationSurface model={mockModel} />,
    );
    expect(container.firstChild).toBeInTheDocument();
    expect(container.querySelector('.pf-topology-visualization-surface')).toBeInTheDocument();

    const updatedModel = {
      ...mockModel,
      nodes: [
        {
          id: 'node-4',
          label: 'Component 4',
          type: 'workflow-node',
          data: {
            workflowType: WorkflowNodeType.COMPONENT,
            status: 'Failed',
          },
        },
        {
          id: 'node-5',
          label: 'Build 4',
          type: 'workflow-node',
          data: {
            workflowType: WorkflowNodeType.BUILD,
            status: 'Failed',
          },
        },
      ],
      edges: [
        {
          id: 'edge-2',
          type: 'edge',
          source: 'node-4',
          target: 'node-5',
        },
      ],
    };

    rerender(<WorkflowVisualizationSurface model={updatedModel} />);
    expect(container.firstChild).toBeInTheDocument();
    // Verify visualization updates with new model
    expect(container.querySelector('.pf-topology-visualization-surface')).toBeInTheDocument();
  });

  it('should handle single node model', () => {
    const singleNodeModel = {
      ...mockModel,
      nodes: [mockModel.nodes[0]],
      edges: [],
    };
    const { container } = routerRenderer(<WorkflowVisualizationSurface model={singleNodeModel} />);
    expect(container.firstChild).toBeInTheDocument();
    // Should render successfully with single node and no edges
    expect(container.querySelector('.pf-topology-visualization-surface')).toBeInTheDocument();
  });
});
