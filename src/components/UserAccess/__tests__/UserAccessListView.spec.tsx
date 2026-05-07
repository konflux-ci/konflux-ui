import { MemoryRouter } from 'react-router-dom';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { FilterContextProvider } from '~/components/Filter/generic/FilterContext';
import type { RoleBinding } from '~/types';
import { defaultKonfluxRoleMap } from '../../../__data__/role-data';
import {
  mockRoleBinding,
  mockRoleBindings,
  mockRoleBindingsWithMultipleUsers,
  mockSingleSubjectRoleBinding,
} from '../../../__data__/rolebinding-data';
import { useRoleMap } from '../../../hooks/useRole';
import { useRoleBindings } from '../../../hooks/useRoleBindings';
import { mockUseNamespaceHook } from '../../../unit-test-utils/mock-namespace';
import { useAccessReviewForModel } from '../../../utils/rbac';
import { createRBs, deleteRB } from '../UserAccessForm/form-utils';
import { UserAccessListView } from '../UserAccessListView';

jest.mock('../UserAccessForm/form-utils', () => ({
  ...jest.requireActual('../UserAccessForm/form-utils'),
  createRBs: jest.fn().mockResolvedValue([]),
  deleteRB: jest.fn().mockResolvedValue(undefined),
}));

jest.useFakeTimers();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  Link: (props) => <a href={props.to}>{props.children}</a>,
}));

jest.mock('../../../utils/rbac', () => ({
  ...jest.requireActual('../../../utils/rbac'),
  useAccessReviewForModel: jest.fn(),
}));
jest.mock('../../../hooks/useRoleBindings');
jest.mock('../../../hooks/useRole');

const UserAccessList = (
  <MemoryRouter>
    <div>
      <div id="hacDev-modal-container" />
      <FilterContextProvider filterParams={['username', 'roleBindingName']}>
        <UserAccessListView />
      </FilterContextProvider>
    </div>
  </MemoryRouter>
);

const createRBsMock = jest.mocked(createRBs);
const deleteRBMock = jest.mocked(deleteRB);

describe('UserAccessListView', () => {
  const mockNamespace = 'test-ns';
  const useNamespaceMock = mockUseNamespaceHook(mockNamespace);
  const useAccessReviewModalMock = useAccessReviewForModel as jest.Mock;
  const useRoleBindingsMock = useRoleBindings as jest.Mock;
  const useRoleMapMock = useRoleMap as jest.Mock;

  beforeEach(() => {
    useNamespaceMock.mockReturnValue(mockNamespace);
    useAccessReviewModalMock.mockReturnValue([true]);
    useRoleBindingsMock.mockReturnValue([mockRoleBindings, true]);
    useRoleMapMock.mockReturnValue([defaultKonfluxRoleMap, true]);
    createRBsMock.mockResolvedValue([]);
    deleteRBMock.mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should display loading state while fetching role bindings', () => {
    useRoleBindingsMock.mockReturnValue([[], false]);
    render(UserAccessList);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('should display error state if role bindings fail to load', () => {
    useRoleBindingsMock.mockReturnValue([[], true, { code: 451 }]);
    render(UserAccessList);
    expect(screen.getByText('Unable to load role bindings')).toBeInTheDocument();
  });

  it('should display role bindings when loaded', () => {
    useRoleBindingsMock.mockReturnValue([[mockRoleBinding], true]);
    render(UserAccessList);
    expect(screen.getByText('user1')).toBeInTheDocument();
  });

  it('should list every subject when one role binding has multiple users', () => {
    useRoleBindingsMock.mockReturnValue([mockRoleBindingsWithMultipleUsers, true]);
    render(UserAccessList);
    expect(screen.getByText('user1')).toBeInTheDocument();
    expect(screen.getByText('user2')).toBeInTheDocument();
  });

  it('should display empty state if no role bindings match the filter', async () => {
    render(UserAccessList);
    const filter = screen.getByPlaceholderText<HTMLInputElement>('Filter by username...');
    act(() => {
      fireEvent.change(filter, { target: { value: 'no-match' } });
      jest.advanceTimersByTime(700);
    });
    await waitFor(() => {
      expect(screen.getByText(/No results match this filter/)).toBeInTheDocument();
    });
  });

  it('should filter rows by role binding name', () => {
    render(UserAccessList);
    act(() => {
      fireEvent.click(screen.getByTestId('user-access-list-filter-dropdown'));
    });
    const roleBindingOption = screen.getByRole('option', { name: 'Role binding' });
    act(() => {
      fireEvent.click(roleBindingOption);
    });
    const filter = screen.getByPlaceholderText<HTMLInputElement>('Filter by role binding name...');
    act(() => {
      fireEvent.change(filter, { target: { value: 'konflux-maintainer-user2' } });
      jest.advanceTimersByTime(700);
    });
    expect(screen.getByText('user2')).toBeInTheDocument();
    expect(screen.queryByText('user1')).not.toBeInTheDocument();
  });

  it('should filter role bindings by username', () => {
    render(UserAccessList);
    const filter = screen.getByPlaceholderText<HTMLInputElement>('Filter by username...');
    act(() => {
      fireEvent.change(filter, { target: { value: 'user1' } });
      jest.advanceTimersByTime(700);
    });
    expect(screen.getByText('user1')).toBeInTheDocument();
    expect(screen.queryByText('user2')).not.toBeInTheDocument();
  });

  it('should show the empty state when there are no role bindings', () => {
    useRoleBindingsMock.mockReturnValue([[], true]);
    render(UserAccessList);
    expect(screen.getByText('Grant access')).toBeInTheDocument();
  });

  it('should allow creating a role binding if the user has permission', () => {
    useAccessReviewModalMock.mockReturnValue([true]);
    render(UserAccessList);
    const grantAccessButton = screen.getByText('Grant access');
    expect(grantAccessButton).toBeEnabled();
  });

  it('should not allow creating a role binding if the user does not have permission', () => {
    useAccessReviewModalMock.mockReturnValue([false]);
    render(UserAccessList);
    const grantAccessButton = screen.getByText('Grant access');
    expect(grantAccessButton.getAttribute('aria-disabled')).toEqual('true');
  });

  it('should handle undefined subjects in role bindings', () => {
    useRoleBindingsMock.mockReturnValue([[{ ...mockRoleBinding, subjects: undefined }], true]);
    const r = render(UserAccessList);
    const rows = r.getAllByRole('row');
    expect(rows.length).toBe(2);
    expect(rows[1]).toHaveTextContent('-');
  });

  it('should render row checkboxes including select-all on the user access table', () => {
    useRoleBindingsMock.mockReturnValue([[mockRoleBinding], true]);
    render(UserAccessList);
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes.length).toBeGreaterThanOrEqual(2);
  });

  it('should show selected count when a row checkbox is toggled', () => {
    useRoleBindingsMock.mockReturnValue([mockRoleBindingsWithMultipleUsers, true]);
    render(UserAccessList);
    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[1]);
    expect(screen.getByTestId('user-access-selected-count')).toHaveTextContent('1 user selected');
  });

  it('should select all visible rows from the header checkbox', () => {
    useRoleBindingsMock.mockReturnValue([mockRoleBindingsWithMultipleUsers, true]);
    render(UserAccessList);
    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[0]);
    expect(screen.getByTestId('user-access-selected-count')).toHaveTextContent('2 users selected');
  });

  it('should prune selection to visible rows when the username filter changes', async () => {
    useRoleBindingsMock.mockReturnValue([mockRoleBindingsWithMultipleUsers, true]);
    render(UserAccessList);
    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[0]);
    expect(screen.getByTestId('user-access-selected-count')).toHaveTextContent('2 users selected');

    const filter = screen.getByPlaceholderText<HTMLInputElement>('Filter by username...');
    act(() => {
      fireEvent.change(filter, { target: { value: 'user1' } });
      jest.advanceTimersByTime(700);
    });

    await waitFor(() => {
      expect(screen.getByTestId('user-access-selected-count')).toHaveTextContent('1 user selected');
    });
  });

  it('should exclude role bindings with undefined subjects when filtering by username', async () => {
    useRoleBindingsMock.mockReturnValue([
      [
        {
          ...mockRoleBinding,
          metadata: { ...mockRoleBinding.metadata, name: 'rb-no-subjects' },
          subjects: undefined,
        },
        {
          ...mockRoleBinding,
          metadata: { ...mockRoleBinding.metadata, name: 'rb-user1' },
          subjects: [{ kind: 'User', name: 'user1' }],
        },
      ],
      true,
    ]);

    render(UserAccessList);

    const filter = screen.getByPlaceholderText<HTMLInputElement>('Filter by username...');
    act(() => {
      fireEvent.change(filter, { target: { value: 'user1' } });
      jest.advanceTimersByTime(700);
    });

    await waitFor(() => {
      expect(screen.getByText('rb-user1')).toBeInTheDocument();
    });

    expect(screen.getByText('user1')).toBeInTheDocument();

    expect(screen.queryByText('rb-no-subjects')).not.toBeInTheDocument();
  });

  describe('Change role save (handleModalSave)', () => {
    const ns = 'test-ns';

    beforeAll(() => {
      jest.useRealTimers();
    });

    afterAll(() => {
      jest.useFakeTimers();
    });

    async function selectNewRoleInModalAndSave(roleDisplayName: string) {
      fireEvent.click(screen.getByRole('button', { name: 'Change access' }));
      await waitFor(() => {
        expect(screen.getByRole('dialog', { name: 'Change role' })).toBeInTheDocument();
      });
      fireEvent.click(screen.getByTestId('user-access-change-role-select'));
      await waitFor(() => {
        expect(screen.getByRole('option', { name: roleDisplayName })).toBeInTheDocument();
      });
      fireEvent.click(screen.getByRole('option', { name: roleDisplayName }));
      fireEvent.click(screen.getByRole('button', { name: 'Save' }));
      await waitFor(() => {
        expect(screen.queryByRole('dialog', { name: 'Change role' })).not.toBeInTheDocument();
      });
    }

    it('one selected user in a single binding: deletes that binding and creates the new role only', async () => {
      const rbs = [
        mockSingleSubjectRoleBinding(
          'rb-alice-contrib',
          'alice',
          'konflux-contributor-user-actions',
        ),
      ];
      useRoleBindingsMock.mockReturnValue([rbs, true]);
      render(UserAccessList);

      const checkboxes = screen.getAllByRole('checkbox');
      fireEvent.click(checkboxes[1]);
      await selectNewRoleInModalAndSave('Maintainer');

      expect(deleteRBMock).toHaveBeenCalledTimes(1);
      expect(deleteRBMock).toHaveBeenCalledWith(rbs[0]);
      expect(createRBsMock).toHaveBeenCalledTimes(1);
      expect(createRBsMock).toHaveBeenCalledWith(
        expect.objectContaining({
          usernames: ['alice'],
          role: 'Maintainer',
          roleMap: defaultKonfluxRoleMap,
        }),
        ns,
      );
    });

    it('one user across multiple single-subject bindings: deletes every binding and creates one new binding', async () => {
      const rbs = [
        mockSingleSubjectRoleBinding('rb-alice-admin', 'alice', 'konflux-admin-user-actions'),
        mockSingleSubjectRoleBinding(
          'rb-alice-contrib',
          'alice',
          'konflux-contributor-user-actions',
        ),
      ];
      useRoleBindingsMock.mockReturnValue([rbs, true]);
      render(UserAccessList);

      const checkboxes = screen.getAllByRole('checkbox');
      fireEvent.click(checkboxes[1]);
      await selectNewRoleInModalAndSave('Maintainer');

      expect(deleteRBMock).toHaveBeenCalledTimes(2);
      expect(deleteRBMock.mock.calls.map(([binding]) => binding.metadata?.name)).toEqual(
        expect.arrayContaining(['rb-alice-admin', 'rb-alice-contrib']),
      );
      expect(createRBsMock).toHaveBeenCalledTimes(1);
      expect(createRBsMock).toHaveBeenCalledWith(
        expect.objectContaining({ usernames: ['alice'], role: 'Maintainer' }),
        ns,
      );
    });

    it('selected subject on a multi-user binding: deletes shared binding, assigns new role, recreates unselected users with prior role', async () => {
      const shared: RoleBinding = {
        ...mockSingleSubjectRoleBinding('rb-shared', 'alice', 'konflux-contributor-user-actions'),
        subjects: [
          { apiGroup: 'rbac.authorization.k8s.io', kind: 'User', name: 'alice' },
          { apiGroup: 'rbac.authorization.k8s.io', kind: 'User', name: 'bob' },
        ],
      };
      useRoleBindingsMock.mockReturnValue([[shared], true]);
      render(UserAccessList);

      const checkboxes = screen.getAllByRole('checkbox');
      fireEvent.click(checkboxes[1]);
      await selectNewRoleInModalAndSave('Admin');

      expect(deleteRBMock).toHaveBeenCalledTimes(1);
      expect(deleteRBMock).toHaveBeenCalledWith(shared);
      expect(createRBsMock).toHaveBeenCalledTimes(2);
      expect(createRBsMock).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({ usernames: ['alice'], role: 'Admin' }),
        ns,
      );
      expect(createRBsMock).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({ usernames: ['bob'], role: 'Contributor' }),
        ns,
      );
    });

    it('downgrade for a single selected user: still performs delete and create with lower role', async () => {
      const rbs = [
        mockSingleSubjectRoleBinding('rb-alice-admin', 'alice', 'konflux-admin-user-actions'),
      ];
      useRoleBindingsMock.mockReturnValue([rbs, true]);
      render(UserAccessList);

      fireEvent.click(screen.getAllByRole('checkbox')[1]);
      await selectNewRoleInModalAndSave('Contributor');

      expect(deleteRBMock).toHaveBeenCalledTimes(1);
      expect(createRBsMock).toHaveBeenCalledWith(
        expect.objectContaining({ usernames: ['alice'], role: 'Contributor' }),
        ns,
      );
    });

    it('multiple selected users each in one binding: deletes all touched bindings and recreates other users from multi-subject bindings as single-user bindings', async () => {
      const rbs = [
        mockSingleSubjectRoleBinding(
          'rb-alice-contrib',
          'alice',
          'konflux-contributor-user-actions',
        ),
        mockSingleSubjectRoleBinding('rb-bob-contrib', 'bob', 'konflux-contributor-user-actions'),
      ];
      useRoleBindingsMock.mockReturnValue([rbs, true]);
      render(UserAccessList);

      const checkboxes = screen.getAllByRole('checkbox');
      fireEvent.click(checkboxes[0]);
      await selectNewRoleInModalAndSave('Maintainer');

      expect(deleteRBMock).toHaveBeenCalledTimes(2);
      expect(createRBsMock).toHaveBeenCalledTimes(1);
      expect(createRBsMock).toHaveBeenCalledWith(
        expect.objectContaining({
          usernames: expect.arrayContaining(['alice', 'bob']),
          role: 'Maintainer',
        }),
        ns,
      );
      expect(createRBsMock.mock.calls[0][0].usernames).toHaveLength(2);
    });

    it('multi-user binding plus single-user binding for selected user removes both bindings and preserves unrelated subject on single-user binding', async () => {
      const shared: RoleBinding = {
        ...mockSingleSubjectRoleBinding('rb-shared', 'alice', 'konflux-maintainer-user-actions'),
        subjects: [
          { apiGroup: 'rbac.authorization.k8s.io', kind: 'User', name: 'alice' },
          { apiGroup: 'rbac.authorization.k8s.io', kind: 'User', name: 'bob' },
        ],
      };
      const aliceOnly = mockSingleSubjectRoleBinding(
        'rb-alice-admin',
        'alice',
        'konflux-admin-user-actions',
      );
      useRoleBindingsMock.mockReturnValue([[shared, aliceOnly], true]);
      render(UserAccessList);

      const checkboxes = screen.getAllByRole('checkbox');
      fireEvent.click(checkboxes[1]);
      await selectNewRoleInModalAndSave('Contributor');

      expect(deleteRBMock).toHaveBeenCalledTimes(2);
      expect(createRBsMock).toHaveBeenCalledTimes(2);
      expect(createRBsMock).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({ usernames: ['alice'], role: 'Contributor' }),
        ns,
      );
      expect(createRBsMock).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({ usernames: ['bob'], role: 'Maintainer' }),
        ns,
      );
    });

    it('clears table selection after a successful save', async () => {
      const rbs = [
        mockSingleSubjectRoleBinding(
          'rb-alice-contrib',
          'alice',
          'konflux-contributor-user-actions',
        ),
      ];
      useRoleBindingsMock.mockReturnValue([rbs, true]);
      render(UserAccessList);

      fireEvent.click(screen.getAllByRole('checkbox')[1]);
      expect(screen.getByTestId('user-access-selected-count')).toHaveTextContent('1 user selected');
      await selectNewRoleInModalAndSave('Maintainer');
      expect(screen.getByTestId('user-access-selected-count')).toHaveTextContent(
        '0 users selected',
      );
    });

    it('two users selected (contributor + maintainer in separate single-subject RBs): new role Maintainer deletes only differing binding; user already on target role is not recreated', async () => {
      const aliceContrib = mockSingleSubjectRoleBinding(
        'rb-alice-contrib',
        'alice',
        'konflux-contributor-user-actions',
      );
      const bobMaintainer = mockSingleSubjectRoleBinding(
        'rb-bob-maintainer',
        'bob',
        'konflux-maintainer-user-actions',
      );
      useRoleBindingsMock.mockReturnValue([[aliceContrib, bobMaintainer], true]);
      render(UserAccessList);

      const checkboxes = screen.getAllByRole('checkbox');
      fireEvent.click(checkboxes[1]);
      fireEvent.click(checkboxes[2]);
      expect(screen.getByTestId('user-access-selected-count')).toHaveTextContent(
        '2 users selected',
      );
      await selectNewRoleInModalAndSave('Maintainer');

      expect(deleteRBMock).toHaveBeenCalledTimes(1);
      expect(deleteRBMock).toHaveBeenCalledWith(aliceContrib);
      expect(createRBsMock).toHaveBeenCalledTimes(1);
      expect(createRBsMock).toHaveBeenCalledWith(
        expect.objectContaining({ usernames: ['alice'], role: 'Maintainer' }),
        ns,
      );
    });
  });
});
