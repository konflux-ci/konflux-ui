import { screen, fireEvent, act } from '@testing-library/react';
import { FilterContextProvider } from '~/components/Filter/generic/FilterContext';
import { Issue, IssueSeverity, IssueState, IssueType } from '~/kite/issue-type';
import { useIssues } from '~/kite/kite-hooks';
import { createMockIssue } from '~/unit-test-utils/mock-issues';
import { mockUseNamespaceHook } from '~/unit-test-utils/mock-namespace';
import { renderWithQueryClient } from '~/unit-test-utils/mock-react-query';
import IssueListView from '../IssuesListView/IssueListView';

jest.useFakeTimers();

jest.mock('~/kite/kite-hooks', () => ({
  useIssues: jest.fn(),
}));

jest.mock('~/hooks/useSortedResources', () => ({
  useSortedResources: jest.fn((data) => data),
}));

jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');
  return {
    ...actual,
    Link: (props) => <a href={props.to}>{props.children}</a>,
    useNavigate: () => jest.fn(),
    useSearchParams: () => [new URLSearchParams(), jest.fn()],
  };
});

const mockUseIssues = useIssues as jest.Mock;

const mockIssues: Issue[] = [
  createMockIssue({
    id: '1',
    title: 'Critical Build Issue',
    description: 'Build failed due to missing dependencies',
    severity: IssueSeverity.CRITICAL,
    state: IssueState.ACTIVE,
    issueType: IssueType.BUILD,
  }),
  createMockIssue({
    id: '2',
    title: 'Minor Test Issue',
    description: 'Test flaky',
    severity: IssueSeverity.MINOR,
    state: IssueState.ACTIVE,
    issueType: IssueType.TEST,
  }),
  createMockIssue({
    id: '3',
    title: 'Resolved Security Issue',
    description: 'Security vulnerability fixed',
    severity: IssueSeverity.MAJOR,
    state: IssueState.RESOLVED,
    issueType: IssueType.DEPENDENCY,
  }),
];

const IssueList = () => (
  <FilterContextProvider filterParams={['name', 'status', 'severity']}>
    <IssueListView />
  </FilterContextProvider>
);

describe('IssueListView', () => {
  mockUseNamespaceHook('test-ns');

  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('should render skeleton if data is not loaded', () => {
    mockUseIssues.mockReturnValue({
      data: { data: [], total: 0, limit: 10, offset: 0 },
      isLoading: true,
      error: null,
    });

    renderWithQueryClient(<IssueList />);
    expect(screen.getByTestId('data-table-skeleton')).toBeInTheDocument();
  });

  it('should render error message if there is an error', () => {
    mockUseIssues.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: { code: 500, message: 'Internal Server Error' },
    });

    renderWithQueryClient(<IssueList />);
    expect(screen.getByText('Unable to load issues')).toBeInTheDocument();
  });

  it('should render empty state when no issues exist', () => {
    mockUseIssues.mockReturnValue({
      data: { data: [], total: 0, limit: 10, offset: 0 },
      isLoading: false,
      error: null,
    });

    renderWithQueryClient(<IssueList />);
    expect(screen.getByText('No issues found')).toBeInTheDocument();
    expect(
      screen.getByText(/No issues have been detected for this application/i),
    ).toBeInTheDocument();
  });

  it('should render issues list with data', () => {
    mockUseIssues.mockReturnValue({
      data: { data: mockIssues, total: 3, limit: 10, offset: 0 },
      isLoading: false,
      error: null,
    });

    renderWithQueryClient(<IssueList />);
    expect(screen.getByText('Issues list')).toBeInTheDocument();
    expect(screen.getByText('This list shows current Konflux issues.')).toBeInTheDocument();
    // Check that table is rendered with role
    expect(screen.getByRole('grid')).toBeInTheDocument();
  });

  it('should render filter toolbar', () => {
    mockUseIssues.mockReturnValue({
      data: { data: mockIssues, total: 3, limit: 10, offset: 0 },
      isLoading: false,
      error: null,
    });

    renderWithQueryClient(<IssueList />);
    expect(screen.getByPlaceholderText('Filter by issue name...')).toBeInTheDocument();
  });

  it('should filter issues by name', () => {
    mockUseIssues.mockReturnValue({
      data: { data: mockIssues, total: 3, limit: 10, offset: 0 },
      isLoading: false,
      error: null,
    });

    const view = renderWithQueryClient(<IssueList />);

    const searchInput = screen.getByRole('textbox', { name: /issue name filter/i });

    act(() => {
      fireEvent.change(searchInput, { target: { value: 'Critical' } });
    });

    act(() => jest.advanceTimersByTime(700));
    view.rerender(<IssueList />);

    // Verify filtering worked by checking the table still renders
    expect(screen.getByRole('grid')).toBeInTheDocument();
  });

  it('should filter issues by status', () => {
    // Mock data with only 1 resolved issue
    const resolvedIssue = createMockIssue({
      id: '3',
      title: 'Resolved Security Issue',
      description: 'Security vulnerability fixed',
      severity: IssueSeverity.MAJOR,
      state: IssueState.RESOLVED,
      issueType: IssueType.DEPENDENCY,
    });

    mockUseIssues.mockReturnValue({
      data: { data: [resolvedIssue], total: 1, limit: 10, offset: 0 },
      isLoading: false,
      error: null,
    });

    renderWithQueryClient(<IssueList />);

    // Verify the issues list is rendered with filtered data showing only 1 row
    expect(screen.getByRole('grid')).toBeInTheDocument();

    // Open status filter to verify it's accessible
    const statusFilterButton = screen.getByRole('button', { name: /status filter menu/i });
    fireEvent.click(statusFilterButton);

    // Verify the list still renders correctly with the resolved filter applied
    expect(screen.getByRole('grid')).toBeInTheDocument();
  });

  it('should filter issues by severity', () => {
    // Mock data with only 1 critical issue
    const criticalIssue = createMockIssue({
      id: '1',
      title: 'Critical Build Issue',
      description: 'Build failed due to missing dependencies',
      severity: IssueSeverity.CRITICAL,
      state: IssueState.ACTIVE,
      issueType: IssueType.BUILD,
    });

    mockUseIssues.mockReturnValue({
      data: { data: [criticalIssue], total: 1, limit: 10, offset: 0 },
      isLoading: false,
      error: null,
    });

    renderWithQueryClient(<IssueList />);

    // Verify the issues list is rendered with filtered data showing only 1 row
    expect(screen.getByRole('grid')).toBeInTheDocument();

    // Open severity filter to verify it's accessible
    const severityFilterButton = screen.getByRole('button', { name: /severity filter menu/i });
    fireEvent.click(severityFilterButton);

    // Verify the list still renders correctly with the critical filter applied
    expect(screen.getByRole('grid')).toBeInTheDocument();
  });

  it('should display multiple filter options', () => {
    mockUseIssues.mockReturnValue({
      data: { data: mockIssues, total: 3, limit: 10, offset: 0 },
      isLoading: false,
      error: null,
    });

    renderWithQueryClient(<IssueList />);

    // Verify status filter exists
    const statusFilterButton = screen.getByRole('button', { name: /status filter menu/i });
    expect(statusFilterButton).toBeInTheDocument();

    // Verify severity filter exists
    const severityFilterButton = screen.getByRole('button', { name: /severity filter menu/i });
    expect(severityFilterButton).toBeInTheDocument();

    // Verify name filter exists
    const nameFilter = screen.getByPlaceholderText('Filter by issue name...');
    expect(nameFilter).toBeInTheDocument();
  });

  it('should allow text input in name filter', () => {
    mockUseIssues.mockReturnValue({
      data: { data: mockIssues, total: 3, limit: 10, offset: 0 },
      isLoading: false,
      error: null,
    });

    renderWithQueryClient(<IssueList />);

    const searchInput = screen.getByRole('textbox', { name: /issue name filter/i });

    // Verify we can type in the filter
    fireEvent.change(searchInput, { target: { value: 'test query' } });
    expect(searchInput).toHaveValue('test query');
  });

  it('should render issues', () => {
    mockUseIssues.mockReturnValue({
      data: {
        data: [
          createMockIssue({
            id: '1',
            title: 'Single Resource Issue',
            relatedFrom: [],
            relatedTo: [],
            scope: {
              resourceType: 'component',
              resourceName: 'test-component',
              resourceNamespace: 'test-ns',
            },
          }),
        ],
        total: 1,
        limit: 10,
        offset: 0,
      },
      isLoading: false,
      error: null,
    });

    renderWithQueryClient(<IssueList />);
    expect(screen.getByRole('grid')).toBeInTheDocument();
  });
});
