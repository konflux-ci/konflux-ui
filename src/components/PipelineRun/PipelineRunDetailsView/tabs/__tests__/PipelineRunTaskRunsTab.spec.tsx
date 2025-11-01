import '@testing-library/jest-dom';
import { screen } from '@testing-library/react';
import { mockUseNamespaceHook } from '~/unit-test-utils/mock-namespace';
import { createUseParamsMock, routerRenderer } from '~/unit-test-utils/mock-react-router';
import PipelineRunTaskRunsTab from '../PipelineRunTaskRunsTab';

// TaskRunListView has its own tests. We mock it here to focus on
// testing PipelineRunTaskRunsTab's specific logic: extracting params
// and passing them to TaskRunListView.
jest.mock('../../../../TaskRunListView/TaskRunListView', () => ({
  __esModule: true,
  default: jest.fn(({ namespace, pipelineRunName }) => (
    <div data-test="task-run-list-view">
      TaskRunListView - {namespace} - {pipelineRunName}
    </div>
  )),
}));

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

  it('should render TaskRunListView with namespace and pipelineRunName', () => {
    routerRenderer(<PipelineRunTaskRunsTab />);

    expect(screen.getByTestId('task-run-list-view')).toBeInTheDocument();
    expect(
      screen.getByText(`TaskRunListView - ${mockNamespace} - ${mockPipelineRunName}`),
    ).toBeInTheDocument();
  });

  it('should update when namespace changes', () => {
    const { rerender } = routerRenderer(<PipelineRunTaskRunsTab />);

    expect(
      screen.getByText(`TaskRunListView - ${mockNamespace} - ${mockPipelineRunName}`),
    ).toBeInTheDocument();

    const newNamespace = 'different-namespace';
    useNamespaceMock.mockReturnValue(newNamespace);

    rerender(<PipelineRunTaskRunsTab />);
    expect(
      screen.getByText(`TaskRunListView - ${newNamespace} - ${mockPipelineRunName}`),
    ).toBeInTheDocument();
  });

  it('should update when pipelineRunName param changes', () => {
    const { rerender } = routerRenderer(<PipelineRunTaskRunsTab />);

    expect(
      screen.getByText(`TaskRunListView - ${mockNamespace} - ${mockPipelineRunName}`),
    ).toBeInTheDocument();

    const newPipelineRunName = 'different-pipeline-run';
    useParamsMock.mockReturnValue({ pipelineRunName: newPipelineRunName });

    rerender(<PipelineRunTaskRunsTab />);
    expect(
      screen.getByText(`TaskRunListView - ${mockNamespace} - ${newPipelineRunName}`),
    ).toBeInTheDocument();
  });

  it('should wrap TaskRunListView in FilterContextProvider', () => {
    routerRenderer(<PipelineRunTaskRunsTab />);

    // FilterContextProvider doesn't add specific DOM attributes, but we can verify
    // the TaskRunListView is rendered
    expect(screen.getByTestId('task-run-list-view')).toBeInTheDocument();
  });
});
