import { mockRoleBinding, mockRoleBindingWithoutUser } from '../../../__data__/rolebinding-data';
import { useAccessReviewForModel } from '../../../utils/rbac';
import { useModalLauncher } from '../../modal/ModalProvider';
import { useWorkspaceInfo } from '../../Workspace/useWorkspaceInfo';
import { useRBActions } from '../user-access-actions';

// Mock the dependencies
jest.mock('../../../utils/rbac', () => ({
  useAccessReviewForModel: jest.fn(),
}));

jest.mock('../../Workspace/useWorkspaceInfo', () => ({
  useWorkspaceInfo: jest.fn(),
}));

jest.mock('../../modal/ModalProvider', () => ({
  useModalLauncher: jest.fn(),
}));

describe('useRBActions', () => {
  const mockWorkspace = 'test-workspace';

  beforeEach(() => {
    // Reset mock functions before each test
    (useAccessReviewForModel as jest.Mock).mockClear();
    (useWorkspaceInfo as jest.Mock).mockClear();
    (useModalLauncher as jest.Mock).mockClear();
  });

  it('should return Edit and Revoke actions when the user has permissions', () => {
    (useAccessReviewForModel as jest.Mock).mockReturnValue([true, true]);
    (useWorkspaceInfo as jest.Mock).mockReturnValue({ workspace: mockWorkspace });
    (useModalLauncher as jest.Mock).mockReturnValue(jest.fn());

    const actions = useRBActions(mockRoleBinding);

    expect(actions).toEqual([
      {
        label: 'Edit access',
        id: 'edit-access-user1',
        disabled: false,
        disabledTooltip: "You don't have permission to edit access",
        cta: {
          href: `/workspaces/${mockWorkspace}/access/edit/user1`,
        },
      },
      {
        label: 'Revoke access',
        id: 'revoke-access-user1',
        disabled: false,
        disabledTooltip: "You don't have permission to revoke access",
        cta: expect.any(Function),
      },
    ]);
  });

  it('should disable Edit and Revoke actions if the user does not have permissions', () => {
    // Mocking the hooks with no permissions
    (useAccessReviewForModel as jest.Mock).mockReturnValue([false, false]);
    (useWorkspaceInfo as jest.Mock).mockReturnValue({ workspace: mockWorkspace });
    (useModalLauncher as jest.Mock).mockReturnValue(jest.fn());

    const actions = useRBActions(mockRoleBinding);

    expect(actions).toEqual([
      {
        label: 'Edit access',
        id: 'edit-access-user1',
        disabled: true,
        disabledTooltip: "You don't have permission to edit access",
        cta: {
          href: `/workspaces/${mockWorkspace}/access/edit/user1`,
        },
      },
      {
        label: 'Revoke access',
        id: 'revoke-access-user1',
        disabled: true,
        disabledTooltip: "You don't have permission to revoke access",
        cta: expect.any(Function),
      },
    ]);
  });

  it('should disable actions if no user is found in the subjects array', () => {
    (useAccessReviewForModel as jest.Mock).mockReturnValue([true, true]);
    (useWorkspaceInfo as jest.Mock).mockReturnValue({ workspace: mockWorkspace });
    (useModalLauncher as jest.Mock).mockReturnValue(jest.fn());

    const actions = useRBActions(mockRoleBindingWithoutUser);

    expect(actions).toEqual([
      {
        label: 'Edit access',
        id: 'edit-access-undefined',
        disabled: true,
        disabledTooltip: "You don't have permission to edit access",
        cta: {
          href: '/workspaces/test-workspace/access/edit/undefined',
        },
      },
      {
        label: 'Revoke access',
        id: 'revoke-access-undefined',
        disabled: true,
        disabledTooltip: "You don't have permission to revoke access",
        cta: expect.any(Function),
      },
    ]);
  });
});
