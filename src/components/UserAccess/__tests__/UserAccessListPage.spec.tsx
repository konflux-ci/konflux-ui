import '@testing-library/jest-dom';
import { Table as PfTable, Thead, Tr, Th, Tbody } from '@patternfly/react-table';
import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MockInfo } from '~/__data__/role-data';
import { mockRoleBinding, mockRoleBindings } from '~/__data__/rolebinding-data';
import { FULL_APPLICATION_TITLE } from '~/consts/labels';
import { RoleBindingModel } from '~/models';
import { RoleBinding } from '~/types';
import { mockAccessReviewUtil } from '~/unit-test-utils/mock-access-review';
import { createK8sWatchResourceMock } from '~/unit-test-utils/mock-k8s';
import { mockUseNamespaceHook } from '~/unit-test-utils/mock-namespace';
import { renderWithQueryClientAndRouter } from '~/utils/test-utils';
import { RBListRow } from '../RBListRow';
import UserAccessPage from '../UserAccessListPage';

jest.useFakeTimers();

// Mock only the data layer - K8s API calls
const mockK8sWatch = createK8sWatchResourceMock();

// Mock useKonfluxPublicInfo to provide role map data
jest.mock('~/hooks/useKonfluxPublicInfo', () => ({
  useKonfluxPublicInfo: jest.fn(() => [MockInfo, true, null]),
}));

// Mock Table component to render with actual RBListRow (not mocking business logic)
// Note: react-router-dom is NOT mocked - renderWithQueryClientAndRouter provides proper routing context

jest.mock('../../../shared/components/table', () => {
  const actual = jest.requireActual('../../../shared/components/table');
  return {
    ...actual,
    Table: (props) => {
      const { data, filters, selected, match, kindObj } = props;
      const cProps = { data, filters, selected, match, kindObj };
      const columns = props.Header(cProps);
      return (
        <PfTable role="table" aria-label="table" variant="compact">
          <Thead>
            <Tr>
              {columns.map((col, idx) => (
                <Th key={idx}>{col.title}</Th>
              ))}
            </Tr>
          </Thead>
          <Tbody>
            {props.data.map((d, i) => (
              <Tr key={i}>
                <RBListRow columns={columns} obj={d} />
              </Tr>
            ))}
          </Tbody>
        </PfTable>
      );
    },
  };
});

describe('UserAccessListPage', () => {
  const mockNamespace = 'test-namespace';
  const useNamespaceMock = mockUseNamespaceHook(mockNamespace);
  const accessReviewMock = mockAccessReviewUtil('useAccessReviewForModel', [true, true]);

  beforeEach(() => {
    jest.clearAllMocks();
    useNamespaceMock.mockReturnValue(mockNamespace);
    accessReviewMock.mockReturnValue([true, true]);
    // Default: return empty role bindings
    mockK8sWatch.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    });
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  describe('Basic rendering', () => {
    it('should render the page with correct title and description', () => {
      renderWithQueryClientAndRouter(<UserAccessPage />);

      expect(screen.getByText('User access')).toBeInTheDocument();
      expect(
        screen.getByText(
          'Invite users to collaborate with you by granting them access to your namespace.',
        ),
      ).toBeInTheDocument();
    });

    it('should set the document title correctly', () => {
      renderWithQueryClientAndRouter(<UserAccessPage />);

      expect(document.title).toBe(`User access | ${FULL_APPLICATION_TITLE}`);
    });

    it('should check access review for RoleBindingModel with create action', () => {
      renderWithQueryClientAndRouter(<UserAccessPage />);

      expect(accessReviewMock).toHaveBeenCalledWith(RoleBindingModel, 'create');
    });
  });

  describe('Empty state', () => {
    it('should display empty state when no role bindings exist', () => {
      mockK8sWatch.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      });

      renderWithQueryClientAndRouter(<UserAccessPage />);

      // Shows filtered empty state when no role bindings exist because
      // the component filters all role bindings (including empty array)
      // This is the current expected behavior - when there's truly no data,
      // the filter result is empty, so FilteredEmptyState is shown
      expect(screen.getByText('No results found')).toBeInTheDocument();
    });

    it('should show Grant access button when empty', () => {
      mockK8sWatch.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      });

      renderWithQueryClientAndRouter(<UserAccessPage />);

      // Should have Grant access button in the page header
      const grantButtons = screen.getAllByText('Grant access');
      expect(grantButtons.length).toBeGreaterThan(0);
    });
  });

  describe('Loading state', () => {
    it('should display spinner while loading role bindings', () => {
      mockK8sWatch.mockReturnValue({
        data: [],
        isLoading: true,
        error: null,
      });

      renderWithQueryClientAndRouter(<UserAccessPage />);

      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });
  });

  describe('Error state', () => {
    it('should display error message when role bindings fail to load', () => {
      mockK8sWatch.mockReturnValue({
        data: [],
        isLoading: false,
        error: { code: 451, message: 'Access denied' },
      });

      renderWithQueryClientAndRouter(<UserAccessPage />);

      expect(screen.getByText('Unable to load role bindings')).toBeInTheDocument();
    });
  });

  describe('Role bindings display', () => {
    it('should render the user access list toolbar when loaded', () => {
      mockK8sWatch.mockReturnValue({
        data: mockRoleBindings,
        isLoading: false,
        error: null,
      });

      renderWithQueryClientAndRouter(<UserAccessPage />);

      // Verify toolbar is present by checking for the filter input
      expect(screen.getByPlaceholderText('Filter by username...')).toBeInTheDocument();
    });

    it('should display role bindings with users and roles', () => {
      mockK8sWatch.mockReturnValue({
        data: mockRoleBindings,
        isLoading: false,
        error: null,
      });

      renderWithQueryClientAndRouter(<UserAccessPage />);

      // Check users are displayed
      expect(screen.getByText('user1')).toBeInTheDocument();
      expect(screen.getByText('user2')).toBeInTheDocument();
      expect(screen.getByText('user3')).toBeInTheDocument();
      expect(screen.getByText('user4')).toBeInTheDocument();

      // Check role display names are shown (use getAllByText for roles that appear multiple times)
      expect(screen.getByText('Contributor')).toBeInTheDocument();
      expect(screen.getAllByText('Maintainer').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('Admin')).toBeInTheDocument();
    });

    it('should display role binding names', () => {
      mockK8sWatch.mockReturnValue({
        data: [mockRoleBinding],
        isLoading: false,
        error: null,
      });

      renderWithQueryClientAndRouter(<UserAccessPage />);

      expect(screen.getByText('metadata-name')).toBeInTheDocument();
    });

    it('should display "-" when role binding has no subjects', () => {
      // RoleBinding with null subjects is valid - represents a role binding
      // without any subjects assigned yet (edge case but valid K8s state)
      const rbWithoutSubjects: RoleBinding = {
        ...mockRoleBinding,
        subjects: null,
      };
      mockK8sWatch.mockReturnValue({
        data: [rbWithoutSubjects],
        isLoading: false,
        error: null,
      });

      renderWithQueryClientAndRouter(<UserAccessPage />);

      // Component displays "-" when subjects is null, as per RBListRow logic
      expect(screen.getByText('-')).toBeInTheDocument();
    });
  });

  describe('Filtering', () => {
    it('should filter role bindings by username', async () => {
      mockK8sWatch.mockReturnValue({
        data: mockRoleBindings,
        isLoading: false,
        error: null,
      });

      const user = userEvent.setup({ delay: null });
      renderWithQueryClientAndRouter(<UserAccessPage />);

      // Initially all users should be visible
      expect(screen.getByText('user1')).toBeInTheDocument();
      expect(screen.getByText('user2')).toBeInTheDocument();
      expect(screen.getByText('user3')).toBeInTheDocument();

      // Filter by user1
      const filterInput = screen.getByPlaceholderText<HTMLInputElement>('Filter by username...');
      await user.clear(filterInput);
      await user.type(filterInput, 'user1');
      act(() => {
        jest.advanceTimersByTime(700);
      });

      await waitFor(() => {
        expect(screen.getByText('user1')).toBeInTheDocument();
        expect(screen.queryByText('user2')).not.toBeInTheDocument();
        expect(screen.queryByText('user3')).not.toBeInTheDocument();
      });
    });

    it('should show filtered empty state when no matches found', async () => {
      mockK8sWatch.mockReturnValue({
        data: mockRoleBindings,
        isLoading: false,
        error: null,
      });

      const user = userEvent.setup({ delay: null });
      renderWithQueryClientAndRouter(<UserAccessPage />);

      // Filter by non-existent user
      const filterInput = screen.getByPlaceholderText<HTMLInputElement>('Filter by username...');
      await user.clear(filterInput);
      await user.type(filterInput, 'nonexistent-user');
      act(() => {
        jest.advanceTimersByTime(700);
      });

      await waitFor(() => {
        expect(screen.getByText('No results found')).toBeInTheDocument();
        expect(screen.getByText('Clear all filters')).toBeInTheDocument();
      });
    });

    it('should clear filters and show all results', async () => {
      mockK8sWatch.mockReturnValue({
        data: mockRoleBindings,
        isLoading: false,
        error: null,
      });

      const user = userEvent.setup({ delay: null });
      renderWithQueryClientAndRouter(<UserAccessPage />);

      // Apply filter
      const filterInput = screen.getByPlaceholderText<HTMLInputElement>('Filter by username...');
      await user.clear(filterInput);
      await user.type(filterInput, 'nonexistent');
      act(() => {
        jest.advanceTimersByTime(700);
      });

      await waitFor(() => {
        expect(screen.getByText('No results found')).toBeInTheDocument();
      });

      // Clear filters
      const clearButton = screen.getByText('Clear all filters');
      await user.click(clearButton);

      await waitFor(() => {
        expect(screen.getByText('user1')).toBeInTheDocument();
        expect(screen.getByText('user2')).toBeInTheDocument();
      });
    });
  });

  describe('Permissions and actions', () => {
    it('should render Actions button in page header', () => {
      mockK8sWatch.mockReturnValue({
        data: mockRoleBindings,
        isLoading: false,
        error: null,
      });

      renderWithQueryClientAndRouter(<UserAccessPage />);

      // Multiple action buttons exist (page header + row menus)
      const actionButtons = screen.getAllByRole('button', { name: /actions/i });
      expect(actionButtons.length).toBeGreaterThanOrEqual(1);
    });

    it('should enable Grant Access button when user has permission', () => {
      mockK8sWatch.mockReturnValue({
        data: mockRoleBindings,
        isLoading: false,
        error: null,
      });
      accessReviewMock.mockReturnValue([true, true]);

      renderWithQueryClientAndRouter(<UserAccessPage />);

      const actionButtons = screen.getAllByRole('button', { name: /actions/i });
      // At least one action button should not be disabled (the page header one)
      expect(actionButtons.some((btn) => !btn.hasAttribute('disabled'))).toBe(true);
    });

    it('should render page content when user lacks create permission', () => {
      accessReviewMock.mockReturnValue([false, true]);
      mockK8sWatch.mockReturnValue({
        data: mockRoleBindings,
        isLoading: false,
        error: null,
      });

      renderWithQueryClientAndRouter(<UserAccessPage />);

      // Page should still render
      expect(screen.getByText('User access')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Filter by username...')).toBeInTheDocument();
    });

    it('should show action menu for role bindings', () => {
      mockK8sWatch.mockReturnValue({
        data: [mockRoleBinding],
        isLoading: false,
        error: null,
      });
      accessReviewMock.mockReturnValue([true, true]);

      renderWithQueryClientAndRouter(<UserAccessPage />);

      // Should render action menu (kebab)
      const actionMenus = screen.getAllByLabelText(/actions/i);
      expect(actionMenus.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Integration: Complete page functionality', () => {
    it('should render complete page with all sections working together', () => {
      mockK8sWatch.mockReturnValue({
        data: mockRoleBindings,
        isLoading: false,
        error: null,
      });
      accessReviewMock.mockReturnValue([true, true]);

      renderWithQueryClientAndRouter(<UserAccessPage />);

      // Page header
      expect(screen.getByText('User access')).toBeInTheDocument();
      const actionButtons = screen.getAllByRole('button', { name: /actions/i });
      expect(actionButtons.length).toBeGreaterThanOrEqual(1);

      // Filter toolbar
      expect(screen.getByPlaceholderText('Filter by username...')).toBeInTheDocument();

      // Table data
      expect(screen.getByText('user1')).toBeInTheDocument();
      expect(screen.getByText('Contributor')).toBeInTheDocument();

      // No errors
      expect(screen.queryByText('Unable to load')).not.toBeInTheDocument();
    });

    it('should transition from loading to data display', () => {
      // Start with loading state
      mockK8sWatch.mockReturnValue({
        data: [],
        isLoading: true,
        error: null,
      });

      const { rerender } = renderWithQueryClientAndRouter(<UserAccessPage />);
      expect(screen.getByRole('progressbar')).toBeInTheDocument();

      // Transition to loaded state
      mockK8sWatch.mockReturnValue({
        data: mockRoleBindings,
        isLoading: false,
        error: null,
      });
      rerender(<UserAccessPage />);

      // Should show data
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      expect(screen.getByText('user1')).toBeInTheDocument();
    });
  });

  describe('Edge cases', () => {
    it('should handle empty subjects array gracefully', () => {
      const rbWithEmptySubjects: RoleBinding = {
        ...mockRoleBinding,
        subjects: [],
      };
      mockK8sWatch.mockReturnValue({
        data: [rbWithEmptySubjects],
        isLoading: false,
        error: null,
      });

      renderWithQueryClientAndRouter(<UserAccessPage />);

      // Should render without crashing
      expect(screen.getByText('User access')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Filter by username...')).toBeInTheDocument();
    });

    it('should handle mixed subject types in role bindings', () => {
      const mixedRB: RoleBinding = {
        ...mockRoleBinding,
        metadata: { name: 'test-rb', namespace: 'test-ns' },
        subjects: [
          { apiGroup: 'rbac.authorization.k8s.io', name: 'test-user', kind: 'User' },
          { apiGroup: 'rbac.authorization.k8s.io', name: 'test-sa', kind: 'ServiceAccount' },
        ],
      };
      mockK8sWatch.mockReturnValue({
        data: [mixedRB],
        isLoading: false,
        error: null,
      });

      renderWithQueryClientAndRouter(<UserAccessPage />);

      // Should show the first subject
      expect(screen.getByText('test-user')).toBeInTheDocument();
    });
  });
});
