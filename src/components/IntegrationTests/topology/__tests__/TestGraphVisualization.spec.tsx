import { screen } from '@testing-library/react';
import { useComponentGroup } from '~/hooks/useComponentGroups';
import { ComponentGroupKind } from '~/types';
import { mockUseNamespaceHook, renderWithQueryClient } from '~/unit-test-utils';
import TestGraphVisualization from '../TestGraphVisualization';

jest.mock('~/hooks/useComponentGroups', () => ({
  useComponentGroup: jest.fn(),
}));

jest.mock('../testgraph-component-factory', () => ({
  testGraphComponentFactory: jest.fn(),
}));

jest.mock('../testgraph-layout-factory', () => ({
  testGraphLayoutFactory: jest.fn(),
}));

jest.mock('~/components/topology/factories', () => ({
  VisualizationFactory: ({
    model,
  }: {
    model?: { nodes?: { type?: string; data?: { groupName?: string } }[] } | null;
  }) => {
    const testNode = model?.nodes?.find((node) => node.type === 'test-node');
    return (
      <div
        data-test="test-graph-visualization"
        data-node-count={model?.nodes?.length ?? 0}
        data-group-name={testNode?.data?.groupName}
      >
        {model ? 'Graph rendered' : 'No model'}
      </div>
    );
  },
}));

const useComponentGroupMock = useComponentGroup as jest.Mock;
mockUseNamespaceHook('test-ns');

const createMockGroup = (testGraph?: Record<string, unknown[]>): ComponentGroupKind =>
  ({
    apiVersion: 'appstudio.redhat.com/v1beta2',
    kind: 'ComponentGroup',
    metadata: { name: 'test-group', namespace: 'test-ns' },
    spec: {
      components: [],
      testGraph,
    },
  }) as ComponentGroupKind;

describe('TestGraphVisualization', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should render the test graph when testGraph exists', () => {
    const group = createMockGroup({
      'smoke-tests': [],
      'integration-tests': [{ name: 'smoke-tests', failFast: false }],
    });
    useComponentGroupMock.mockReturnValue([group, true, undefined]);

    renderWithQueryClient(<TestGraphVisualization namespace="test-ns" groupName="test-group" />);

    expect(screen.getByText('Execution order')).toBeInTheDocument();
    expect(screen.getByTestId('test-graph-visualization')).toBeInTheDocument();
    expect(screen.getByText('Graph rendered')).toBeInTheDocument();
  });

  it('should render fail-fast legend when failFast is present', () => {
    const group = createMockGroup({
      'smoke-tests': [],
      'integration-tests': [{ name: 'smoke-tests', failFast: true }],
    });
    useComponentGroupMock.mockReturnValue([group, true, undefined]);

    renderWithQueryClient(<TestGraphVisualization namespace="test-ns" groupName="test-group" />);

    // Legend renders as a single paragraph: bold label + explanation
    expect(screen.getByText('Fail-fast').closest('p')).toHaveTextContent(
      'Fail-fast — if this test fails, subsequent stages will not run',
    );
  });

  it('should not render fail-fast legend when no test has failFast', () => {
    const group = createMockGroup({
      'smoke-tests': [],
    });
    useComponentGroupMock.mockReturnValue([group, true, undefined]);

    renderWithQueryClient(<TestGraphVisualization namespace="test-ns" groupName="test-group" />);

    expect(screen.queryByText('Fail-fast')).not.toBeInTheDocument();
  });

  it('should render loading spinner when group is not loaded', () => {
    useComponentGroupMock.mockReturnValue([null, false, undefined]);

    renderWithQueryClient(<TestGraphVisualization namespace="test-ns" groupName="test-group" />);

    expect(screen.getByText('Execution order')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('should render error state when loading fails', () => {
    const error = new Error('Failed to load component group');
    useComponentGroupMock.mockReturnValue([null, true, error]);

    renderWithQueryClient(<TestGraphVisualization namespace="test-ns" groupName="test-group" />);

    expect(screen.getByText('Execution order')).toBeInTheDocument();
    expect(screen.getByText('Unable to load group')).toBeInTheDocument();
    expect(screen.queryByTestId('test-graph-visualization')).not.toBeInTheDocument();
  });

  it('should return null when testGraph is undefined', () => {
    const group = createMockGroup(undefined);
    useComponentGroupMock.mockReturnValue([group, true, undefined]);

    const { container } = renderWithQueryClient(
      <TestGraphVisualization namespace="test-ns" groupName="test-group" />,
    );

    expect(container.firstChild).toBeNull();
  });

  it('should return null when testGraph is empty', () => {
    const group = createMockGroup({});
    useComponentGroupMock.mockReturnValue([group, true, undefined]);

    const { container } = renderWithQueryClient(
      <TestGraphVisualization namespace="test-ns" groupName="test-group" />,
    );

    expect(container.firstChild).toBeNull();
  });

  it('should pass the correct groupName to the model', () => {
    const group = createMockGroup({
      'test-a': [],
    });
    useComponentGroupMock.mockReturnValue([group, true, undefined]);

    renderWithQueryClient(<TestGraphVisualization namespace="test-ns" groupName="test-group" />);

    expect(screen.getByTestId('test-graph-visualization')).toHaveAttribute(
      'data-group-name',
      'test-group',
    );
  });

  it('should call useComponentGroup with correct params', () => {
    const group = createMockGroup({});
    useComponentGroupMock.mockReturnValue([group, true, undefined]);

    renderWithQueryClient(<TestGraphVisualization namespace="test-ns" groupName="my-group" />);

    expect(useComponentGroupMock).toHaveBeenCalledWith('test-ns', 'my-group', true);
  });

  it('should recalculate model when testGraph changes', () => {
    const group1 = createMockGroup({ 'test-a': [] });
    useComponentGroupMock.mockReturnValue([group1, true, undefined]);

    const { rerender } = renderWithQueryClient(
      <TestGraphVisualization namespace="test-ns" groupName="test-group" />,
    );

    expect(screen.getByTestId('test-graph-visualization')).toHaveAttribute('data-node-count', '2');

    const group2 = createMockGroup({ 'test-a': [], 'test-b': [] });
    useComponentGroupMock.mockReturnValue([group2, true, undefined]);

    rerender(<TestGraphVisualization namespace="test-ns" groupName="test-group" />);

    expect(screen.getByTestId('test-graph-visualization')).toHaveAttribute('data-node-count', '3');
  });
});
