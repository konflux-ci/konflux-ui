import { useContext } from 'react';
import { useQuery } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { createReactRouterMock } from '../../../utils/test-utils';
import { getLastUsedWorkspace, setLastUsedWorkspace } from '../utils';
import { WorkspaceProvider, WorkspaceContext } from '../workspace-context';

jest.mock('@tanstack/react-query', () => ({
  ...jest.requireActual('@tanstack/react-query'),
  useQuery: jest.fn(),
}));

jest.mock('../utils', () => ({
  ...jest.requireActual('../utils'),
  createWorkspaceQueryOptions: jest.fn(),
  getLastUsedWorkspace: jest.fn(),
  setLastUsedWorkspace: jest.fn(),
}));

// Test data
const mockWorkspaces = [
  {
    metadata: {
      name: 'workspace-1',
    },
    status: {
      namespaces: [{ type: 'default', name: 'test-namespace' }],
      type: 'home',
    },
  },
  {
    metadata: {
      name: 'workspace-2',
    },
    status: {
      namespaces: [{ type: 'default', name: 'test-namespace-2' }],
    },
  },
];

const mockNamespace = 'test-namespace';

const mockUseNavigate = createReactRouterMock('useNavigate');
const mockUseParams = createReactRouterMock('useParams');
const mockUseQuery = useQuery as jest.Mock;
const mockGetLastUsedWorkspace = getLastUsedWorkspace as jest.Mock;

describe('WorkspaceProvider', () => {
  const mockNavigate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseNavigate.mockReturnValue(mockNavigate);
    mockUseParams.mockReturnValue({});
    mockGetLastUsedWorkspace.mockReturnValue('workspace-1');
  });

  it('should renders loading spinner when data is being fetched', () => {
    mockUseQuery
      .mockReturnValueOnce({
        data: undefined,
        isLoading: true,
      })
      .mockReturnValueOnce({
        data: undefined,
        isLoading: true,
      });

    render(
      <WorkspaceProvider>
        <div>Child content</div>
      </WorkspaceProvider>,
    );

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    expect(screen.queryByText('Child content')).not.toBeInTheDocument();
  });

  it('should renders children when data is loaded', async () => {
    mockUseQuery
      .mockReturnValueOnce({
        data: mockWorkspaces,
        isLoading: false,
      })
      .mockReturnValue({
        data: mockWorkspaces[0],
        isLoading: false,
      });

    render(
      <WorkspaceProvider>
        <div>Child content</div>
      </WorkspaceProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText('Child content')).toBeInTheDocument();
    });
  });

  it('handles error state correctly', () => {
    const errorMessage = 'Failed to load workspace';
    mockUseQuery
      .mockReturnValueOnce({
        data: mockWorkspaces,
        isLoading: false,
      })
      .mockReturnValueOnce({
        error: new Error(errorMessage),
        isLoading: false,
      });

    render(
      <WorkspaceProvider>
        <div>Child content</div>
      </WorkspaceProvider>,
    );

    expect(screen.getByText(`Unable to access workspace workspace-1`)).toBeInTheDocument();
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  it('provides correct context values', async () => {
    mockUseQuery
      .mockReturnValueOnce({
        data: mockWorkspaces,
        isLoading: false,
      })
      .mockReturnValueOnce({
        data: mockWorkspaces[0],
        isLoading: false,
      });

    const TestConsumer = () => {
      const context = useContext(WorkspaceContext);
      return (
        <div>
          <div data-test="namespace">{context.namespace}</div>
          <div data-test="workspace">{context.workspace}</div>
          <div data-test="workspaces-loaded">{String(context.workspacesLoaded)}</div>
        </div>
      );
    };

    render(
      <WorkspaceProvider>
        <TestConsumer />
      </WorkspaceProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('namespace')).toHaveTextContent(mockNamespace);
      expect(screen.getByTestId('workspace')).toHaveTextContent('workspace-1');
      expect(screen.getByTestId('workspaces-loaded')).toHaveTextContent('true');
    });
  });

  it('updates last used workspace when active workspace changes', async () => {
    mockUseQuery
      .mockReturnValueOnce({
        data: mockWorkspaces,
        isLoading: false,
      })
      .mockReturnValueOnce({
        data: mockWorkspaces[0],
        isLoading: false,
      });

    mockUseParams.mockReturnValue({ workspaceName: 'workspace-2' });

    render(
      <WorkspaceProvider>
        <div>Child content</div>
      </WorkspaceProvider>,
    );

    await waitFor(() => {
      expect(setLastUsedWorkspace).toHaveBeenCalledWith('workspace-2');
    });
  });

  it('navigates to home workspace when error occurs and home button is clicked', async () => {
    const errorMessage = 'Failed to load workspace';
    mockUseQuery
      .mockReturnValueOnce({
        data: mockWorkspaces,
        isLoading: false,
      })
      .mockReturnValueOnce({
        error: new Error(errorMessage),
        isLoading: false,
      });

    render(
      <WorkspaceProvider>
        <div>Child content</div>
      </WorkspaceProvider>,
    );

    const homeButton = screen.getByText('Go to workspace-1 workspace');
    await userEvent.click(homeButton);

    expect(setLastUsedWorkspace).toHaveBeenCalledWith('workspace-1');
    expect(mockNavigate).toHaveBeenCalledWith('/workspaces/workspace-1/applications');
  });
});
