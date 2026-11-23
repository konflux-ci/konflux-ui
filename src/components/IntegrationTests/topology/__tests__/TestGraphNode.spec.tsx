import * as React from 'react';
import { Node, NodeModel } from '@patternfly/react-topology';
import { screen } from '@testing-library/react';
import { renderWithQueryClientAndRouter } from '~/unit-test-utils';
import TestGraphNode from '../TestGraphNode';

jest.mock('@patternfly/react-topology', () => {
  const originalModule = jest.requireActual('@patternfly/react-topology');
  return {
    ...originalModule,
    withSelection: () => (WrappedComponent: React.ComponentType) => WrappedComponent,
    TaskNode: ({
      leadIcon,
      toolTip,
    }: {
      leadIcon?: React.ReactNode;
      toolTip?: React.ReactNode;
    }) => (
      <div data-test="task-node">
        {leadIcon && <div data-test="lead-icon">{leadIcon}</div>}
        <div data-test="tooltip">{toolTip}</div>
      </div>
    ),
  };
});

type TestGraphNodeData = {
  failFast?: boolean;
  groupName: string;
  namespace: string;
};

const createElement = (
  data?: TestGraphNodeData,
  label = 'test-a',
): Node<NodeModel, TestGraphNodeData> =>
  ({
    getData: () => data,
    getLabel: () => label,
  }) as unknown as Node<NodeModel, TestGraphNodeData>;

const renderNode = (element: Node<NodeModel, TestGraphNodeData>) =>
  renderWithQueryClientAndRouter(<TestGraphNode element={element} />);

describe('TestGraphNode', () => {
  it('should render tooltip with title and a link to the test details page', () => {
    const { container } = renderNode(
      createElement({ failFast: false, groupName: 'my-group', namespace: 'test-ns' }),
    );

    expect(screen.getByText('test-a')).toBeInTheDocument();
    expect(screen.queryByText('Fail-fast enabled')).not.toBeInTheDocument();
    expect(container.querySelector('[data-test="lead-icon"]')).toBeNull();

    const link = screen.getByRole('link', { name: 'View test details for test-a' });
    expect(link).toHaveTextContent('View test details');
    expect(link).toHaveAttribute('href', '/ns/test-ns/groups/my-group/integrationtests/test-a');
  });

  it('should show the fail-fast warning and lead icon when failFast is set', () => {
    const { container } = renderNode(
      createElement({ failFast: true, groupName: 'my-group', namespace: 'test-ns' }),
    );

    expect(screen.getByText('Fail-fast enabled')).toBeInTheDocument();
    expect(screen.getByLabelText('Fail-fast enabled')).toBeInTheDocument();
    expect(container.querySelector('[data-test="lead-icon"]')).not.toBeNull();
    expect(screen.getByRole('link', { name: 'View test details for test-a' })).toBeInTheDocument();
  });

  it('should fall back to the plain label when node data is missing', () => {
    renderNode(createElement(undefined));

    expect(screen.getByText('test-a')).toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });
});
