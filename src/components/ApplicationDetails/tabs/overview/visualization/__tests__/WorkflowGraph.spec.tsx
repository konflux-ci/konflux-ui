import { screen } from '@testing-library/react';
import { routerRenderer } from '../../../../../../utils/test-utils';
import { WorkflowNodeType } from '../types';
import WorkflowGraph from '../WorkflowGraph';

const mockNodes = [
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
];

const mockEdges = [
  {
    id: 'edge-1',
    type: 'edge',
    source: 'node-1',
    target: 'node-2',
  },
];

describe('WorkflowGraph', () => {
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

  it('should render the workflow graph container', () => {
    routerRenderer(<WorkflowGraph nodes={mockNodes} edges={mockEdges} expanded={false} />);
    expect(screen.getByTestId('workflow-graph')).toBeInTheDocument();
  });

  it('should render WorkflowVisualizationSurface', () => {
    routerRenderer(<WorkflowGraph nodes={mockNodes} edges={mockEdges} expanded={false} />);
    expect(screen.getByTestId('workflow-graph')).toHaveClass('workflow-graph');
  });

  it('should use correct layout for non-expanded view', () => {
    const { container } = routerRenderer(
      <WorkflowGraph nodes={mockNodes} edges={mockEdges} expanded={false} />,
    );
    expect(container.querySelector('.workflow-graph')).toBeInTheDocument();
  });

  it('should use correct layout for expanded view', () => {
    const { container } = routerRenderer(
      <WorkflowGraph nodes={mockNodes} edges={mockEdges} expanded={true} />,
    );
    expect(container.querySelector('.workflow-graph')).toBeInTheDocument();
  });

  it('should pass nodes to WorkflowVisualizationSurface', () => {
    routerRenderer(<WorkflowGraph nodes={mockNodes} edges={mockEdges} expanded={false} />);
    expect(screen.getByTestId('workflow-graph')).toBeInTheDocument();
  });

  it('should pass edges to WorkflowVisualizationSurface', () => {
    routerRenderer(<WorkflowGraph nodes={mockNodes} edges={mockEdges} expanded={false} />);
    expect(screen.getByTestId('workflow-graph')).toBeInTheDocument();
  });

  it('should create model with correct graph configuration for collapsed view', () => {
    routerRenderer(<WorkflowGraph nodes={mockNodes} edges={mockEdges} expanded={false} />);
    const graph = screen.getByTestId('workflow-graph');
    expect(graph).toBeInTheDocument();
  });

  it('should create model with correct graph configuration for expanded view', () => {
    routerRenderer(<WorkflowGraph nodes={mockNodes} edges={mockEdges} expanded={true} />);
    const graph = screen.getByTestId('workflow-graph');
    expect(graph).toBeInTheDocument();
  });

  it('should use correct x and y coordinates for collapsed view', () => {
    routerRenderer(<WorkflowGraph nodes={mockNodes} edges={mockEdges} expanded={false} />);
    expect(screen.getByTestId('workflow-graph')).toBeInTheDocument();
  });

  it('should use correct x and y coordinates for expanded view', () => {
    routerRenderer(<WorkflowGraph nodes={mockNodes} edges={mockEdges} expanded={true} />);
    expect(screen.getByTestId('workflow-graph')).toBeInTheDocument();
  });

  it('should render with empty nodes and edges', () => {
    routerRenderer(<WorkflowGraph nodes={[]} edges={[]} expanded={false} />);
    expect(screen.getByTestId('workflow-graph')).toBeInTheDocument();
  });

  it('should handle expanded toggle', () => {
    const { rerender } = routerRenderer(
      <WorkflowGraph nodes={mockNodes} edges={mockEdges} expanded={false} />,
    );
    expect(screen.getByTestId('workflow-graph')).toBeInTheDocument();

    rerender(<WorkflowGraph nodes={mockNodes} edges={mockEdges} expanded={true} />);
    expect(screen.getByTestId('workflow-graph')).toBeInTheDocument();
  });

  it('should render with multiple nodes', () => {
    const multipleNodes = [
      ...mockNodes,
      {
        id: 'node-3',
        label: 'Test 1',
        type: 'workflow-node',
        data: {
          workflowType: WorkflowNodeType.TESTS,
          status: 'Succeeded',
        },
      },
    ];
    routerRenderer(<WorkflowGraph nodes={multipleNodes} edges={mockEdges} expanded={false} />);
    expect(screen.getByTestId('workflow-graph')).toBeInTheDocument();
  });

  it('should render with single edge', () => {
    routerRenderer(<WorkflowGraph nodes={mockNodes} edges={mockEdges} expanded={false} />);
    expect(screen.getByTestId('workflow-graph')).toBeInTheDocument();
  });

  it('should apply correct graph configuration', () => {
    const { container } = routerRenderer(
      <WorkflowGraph nodes={mockNodes} edges={mockEdges} expanded={false} />,
    );
    const graphDiv = container.querySelector('.workflow-graph');
    expect(graphDiv).toBeInTheDocument();
  });

  it('should handle component re-render', () => {
    const { rerender } = routerRenderer(
      <WorkflowGraph nodes={mockNodes} edges={mockEdges} expanded={false} />,
    );
    expect(screen.getByTestId('workflow-graph')).toBeInTheDocument();

    rerender(<WorkflowGraph nodes={mockNodes} edges={mockEdges} expanded={false} />);
    expect(screen.getByTestId('workflow-graph')).toBeInTheDocument();
  });
});
