import type { ComponentProps } from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { defaultKonfluxRoleMap } from '~/__data__/role-data';
import { mockSingleSubjectRoleBinding } from '../../../__data__/rolebinding-data';
import { useRoleMap } from '../../../hooks/useRole';
import { splitRowKey, UserAccessChangeRoleModal } from '../UserAccessChangeRoleModal';

jest.mock('../../../hooks/useRole', () => ({
  useRoleMap: jest.fn(),
}));

describe('UserAccessChangeRoleModal', () => {
  describe('splitRowKey', () => {
    it('parses segments from an expandRoleBindingsToTableRows row key', () => {
      expect(splitRowKey('konflux-contributor-user-actions__0__User__alice')).toEqual({
        roleRefName: 'konflux-contributor-user-actions',
        roleName: 'contributor',
        index: '0',
        role: 'User',
        username: 'alice',
      });
    });
  });

  const useRoleMapMock = useRoleMap as jest.Mock;

  beforeEach(() => {
    useRoleMapMock.mockReturnValue([defaultKonfluxRoleMap, true]);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  function renderModal(props: Partial<ComponentProps<typeof UserAccessChangeRoleModal>> = {}) {
    const defaultOnClose = jest.fn();
    const defaultOnSave = jest.fn();
    const onCloseFn = props.onClose ?? defaultOnClose;
    const onSaveFn = props.onSave ?? defaultOnSave;
    render(
      <div>
        <div id="hacDev-modal-container" />
        <UserAccessChangeRoleModal
          isOpen
          onClose={onCloseFn}
          onSave={onSaveFn}
          selectedRowKeys={
            props.selectedRowKeys ?? new Set(['konflux-contributor-user-actions__0__User__alice'])
          }
          allAffectedRoleBindings={
            props.allAffectedRoleBindings ?? [
              mockSingleSubjectRoleBinding('rb1', 'alice', 'konflux-contributor-user-actions'),
            ]
          }
        />
      </div>,
    );
    return { onClose: onCloseFn, onSave: onSaveFn };
  }

  async function chooseRole(roleDisplayName: string) {
    fireEvent.click(screen.getByTestId('user-access-change-role-select'));
    await waitFor(() => {
      expect(screen.getByRole('option', { name: roleDisplayName })).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole('option', { name: roleDisplayName }));
  }

  it('save stays disabled until a role is chosen', async () => {
    renderModal();
    expect(screen.getByRole('button', { name: 'Save' })).toHaveAttribute('aria-disabled', 'true');
    await chooseRole('Maintainer');
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Save' })).not.toHaveAttribute(
        'aria-disabled',
        'true',
      );
    });
  });

  it('allows downgrade when exactly one user is selected', async () => {
    renderModal({
      selectedRowKeys: new Set(['konflux-admin-user-actions__0__User__alice']),
      allAffectedRoleBindings: [
        mockSingleSubjectRoleBinding('rb1', 'alice', 'konflux-admin-user-actions'),
      ],
    });
    await chooseRole('Contributor');
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Save' })).not.toHaveAttribute(
        'aria-disabled',
        'true',
      );
    });
  });

  it('blocks downgrade for multiple users when the new role is below the highest affected role', async () => {
    renderModal({
      selectedRowKeys: new Set([
        'konflux-admin-user-actions__0__User__alice',
        'konflux-contributor-user-actions__0__User__bob',
      ]),
      allAffectedRoleBindings: [
        mockSingleSubjectRoleBinding('rba', 'alice', 'konflux-admin-user-actions'),
        mockSingleSubjectRoleBinding('rbb', 'bob', 'konflux-contributor-user-actions'),
      ],
    });
    await chooseRole('Contributor');
    expect(screen.getByRole('button', { name: 'Save' })).toHaveAttribute('aria-disabled', 'true');
  });

  it('allows the same tier as highest role for multiple users (no downgrade)', async () => {
    renderModal({
      selectedRowKeys: new Set([
        'konflux-maintainer-user-actions__0__User__alice',
        'konflux-contributor-user-actions__0__User__bob',
      ]),
      allAffectedRoleBindings: [
        mockSingleSubjectRoleBinding('rba', 'alice', 'konflux-maintainer-user-actions'),
        mockSingleSubjectRoleBinding('rbb', 'bob', 'konflux-contributor-user-actions'),
      ],
    });
    await chooseRole('Maintainer');
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Save' })).not.toHaveAttribute(
        'aria-disabled',
        'true',
      );
    });
  });

  it('allows upgrade for multiple users when the new role is not below any user peak role', async () => {
    renderModal({
      selectedRowKeys: new Set([
        'konflux-contributor-user-actions__0__User__alice',
        'konflux-contributor-user-actions__0__User__bob',
      ]),
      allAffectedRoleBindings: [
        mockSingleSubjectRoleBinding('rba', 'alice', 'konflux-contributor-user-actions'),
        mockSingleSubjectRoleBinding('rbb', 'bob', 'konflux-contributor-user-actions'),
      ],
    });
    await chooseRole('Maintainer');
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Save' })).not.toHaveAttribute(
        'aria-disabled',
        'true',
      );
    });
  });

  it('renders each selected row as "username (kind): highest role", e.g. alice (User): Contributor', () => {
    renderModal({
      selectedRowKeys: new Set(['konflux-contributor-user-actions__0__User__alice']),
      allAffectedRoleBindings: [
        mockSingleSubjectRoleBinding('rb', 'alice', 'konflux-contributor-user-actions'),
      ],
    });
    expect(screen.getByRole('listitem')).toHaveTextContent('alice (User): Contributor');
  });
});
