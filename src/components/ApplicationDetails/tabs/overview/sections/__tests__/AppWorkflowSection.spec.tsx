import { screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import {
  createReactRouterMock,
  renderWithQueryClientAndRouter,
} from '../../../../../../utils/test-utils';
import { useAppWorkflowData } from '../../visualization/hooks/useAppWorkflowData';
import AppWorkflowSection from '../AppWorkflowSection';

jest.mock('../../visualization/hooks/useAppWorkflowData', () => ({
  useAppWorkflowData: jest.fn(),
}));

const useSearchParamsMock = createReactRouterMock('useSearchParams');
const useAppWorkflowDataMock = useAppWorkflowData as jest.Mock;

const mockWorkflowModel = {
  nodes: [
    {
      id: 'node-1',
      label: 'Component 1',
      type: 'workflow-node',
      data: { status: 'Succeeded' },
    },
    {
      id: 'node-2',
      label: 'Build 1',
      type: 'workflow-node',
      data: { status: 'Running' },
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

describe('AppWorkflowSection', () => {
  let searchParams: URLSearchParams;
  let setSearchParams: jest.Mock;

  beforeEach(() => {
    searchParams = new URLSearchParams();
    setSearchParams = jest.fn();
    useSearchParamsMock.mockReturnValue([searchParams, setSearchParams]);
    useAppWorkflowDataMock.mockReturnValue([mockWorkflowModel, true, []]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window.SVGElement as any).prototype.getBBox = () => ({ x: 100, y: 100 });
  });

  afterEach(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window.SVGElement as any).prototype.getBBox = undefined;
  });

  it('should render the section title', () => {
    renderWithQueryClientAndRouter(<AppWorkflowSection applicationName="test-app" />);
    expect(screen.getByText('Lifecycle')).toBeInTheDocument();
  });

  it('should render the description', () => {
    renderWithQueryClientAndRouter(<AppWorkflowSection applicationName="test-app" />);
    expect(
      screen.getByText(
        'This is a visualization of your application pipeline, from source code through release.',
      ),
    ).toBeInTheDocument();
  });

  it('should show spinner when data is not loaded', () => {
    useAppWorkflowDataMock.mockReturnValue([{ nodes: [], edges: [] }, false, []]);
    renderWithQueryClientAndRouter(<AppWorkflowSection applicationName="test-app" />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('should render WorkflowGraph when data is loaded', async () => {
    renderWithQueryClientAndRouter(<AppWorkflowSection applicationName="test-app" />);
    await waitFor(() => {
      expect(screen.getByTestId('workflow-graph')).toBeInTheDocument();
    });
  });

  it('should show error state when there are errors', () => {
    useAppWorkflowDataMock.mockReturnValue([
      { nodes: [], edges: [] },
      true,
      [new Error('Test error')],
    ]);
    renderWithQueryClientAndRouter(<AppWorkflowSection applicationName="test-app" />);
    expect(screen.getByText('Test error')).toBeInTheDocument();
  });

  it('should show expand button when loaded without errors', () => {
    renderWithQueryClientAndRouter(<AppWorkflowSection applicationName="test-app" />);
    expect(screen.getByText('Expand items')).toBeInTheDocument();
  });

  it('should toggle expanded state when button is clicked', () => {
    renderWithQueryClientAndRouter(<AppWorkflowSection applicationName="test-app" />);
    const expandButton = screen.getByText('Expand items');
    expandButton.click();
    expect(setSearchParams).toHaveBeenCalled();
  });

  it('should show collapse button when expanded', () => {
    searchParams.set('expanded', 'true');
    useSearchParamsMock.mockReturnValue([searchParams, setSearchParams]);
    renderWithQueryClientAndRouter(<AppWorkflowSection applicationName="test-app" />);
    expect(screen.getByText('Collapse items')).toBeInTheDocument();
  });

  it('should pass expanded prop to WorkflowGraph', async () => {
    searchParams.set('expanded', 'true');
    useSearchParamsMock.mockReturnValue([searchParams, setSearchParams]);
    renderWithQueryClientAndRouter(<AppWorkflowSection applicationName="test-app" />);
    await waitFor(() => {
      expect(screen.getByTestId('workflow-graph')).toBeInTheDocument();
    });
  });

  it('should call useAppWorkflowData with correct parameters', () => {
    renderWithQueryClientAndRouter(<AppWorkflowSection applicationName="test-app" />);
    expect(useAppWorkflowDataMock).toHaveBeenCalledWith('test-app', false);
  });

  it('should call useAppWorkflowData with expanded true', () => {
    searchParams.set('expanded', 'true');
    useSearchParamsMock.mockReturnValue([searchParams, setSearchParams]);
    renderWithQueryClientAndRouter(<AppWorkflowSection applicationName="test-app" />);
    expect(useAppWorkflowDataMock).toHaveBeenCalledWith('test-app', true);
  });

  it('should not show expand button when there are errors', () => {
    useAppWorkflowDataMock.mockReturnValue([
      { nodes: [], edges: [] },
      true,
      [new Error('Test error')],
    ]);
    renderWithQueryClientAndRouter(<AppWorkflowSection applicationName="test-app" />);
    expect(screen.queryByText('Expand items')).not.toBeInTheDocument();
  });

  it('should not show expand button when not loaded', () => {
    useAppWorkflowDataMock.mockReturnValue([{ nodes: [], edges: [] }, false, []]);
    renderWithQueryClientAndRouter(<AppWorkflowSection applicationName="test-app" />);
    expect(screen.queryByText('Expand items')).not.toBeInTheDocument();
  });
});
