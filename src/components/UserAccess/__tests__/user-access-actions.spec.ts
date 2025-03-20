import { mockRoleBinding, mockRoleBindingWithoutUser } from '../../../__data__/rolebinding-data';
import { mockUseNamespaceHook } from '../../../unit-test-utils/mock-namespace';
import { useAccessReviewForModel } from '../../../utils/rbac';
import { useRBActions } from '../user-access-actions';

// Mock the dependencies
jest.mock('../../../utils/rbac', () => ({
  useAccessReviewForModel: jest.fn(),
}));

// Removing the below mock would get the error:
// TypeError: Cannot read properties of null (reading 'useContext')
jest.mock('../../modal/ModalProvider', () => ({
  useModalLauncher: jest.fn(),
}));

describe('useRBActions', () => {
  const mockNamespace = 'test-ns';
  const useNamespaceMock = mockUseNamespaceHook(mockNamespace);
  const useAccessReviewForModelMock = useAccessReviewForModel as jest.Mock;
  useNamespaceMock.mockReturnValue(mockNamespace);

  const editPermissionItem = {
    label: 'Edit access',
    id: 'edit-access-user1',
    disabled: false,
    disabledTooltip: "You don't have permission to edit access",
    cta: {
      href: `/ns/${mockNamespace}/access/edit/user1`,
    },
  };
  const deletePermissionItem = {
    label: 'Revoke access',
    id: 'revoke-access-user1',
    disabled: false,
    disabledTooltip: "You don't have permission to revoke access",
    cta: expect.any(Function),
  };

  beforeEach(() => {
    useAccessReviewForModelMock.mockClear();
  });

  it('should return Edit and Revoke actions when the user has permissions', () => {
    useAccessReviewForModelMock.mockReturnValue([true, true]);

    const actions = useRBActions(mockRoleBinding);
    const permissionItems = [editPermissionItem, deletePermissionItem];
    expect(actions).toEqual(permissionItems);
  });

  it('should disable Edit and Revoke actions if the user does not have permissions', () => {
    // Mocking the hooks with no permissions
    useAccessReviewForModelMock.mockReturnValue([false, false]);

    const actions = useRBActions(mockRoleBinding);
    editPermissionItem.disabled = true;
    deletePermissionItem.disabled = true;
    const permissionItems = [editPermissionItem, deletePermissionItem];
    expect(actions).toEqual(permissionItems);
  });

  it('should disable actions if no user is found in the subjects array', () => {
    useAccessReviewForModelMock.mockReturnValue([true, true]);

    const actions = useRBActions(mockRoleBindingWithoutUser);

    const permissionItems = [
      {
        ...editPermissionItem,
        disabled: true,
        id: 'edit-access-undefined',
        cta: {
          ...editPermissionItem.cta,
          href: `/ns/${mockNamespace}/access/edit/undefined`,
        },
      },
      {
        ...deletePermissionItem,
        disabled: true,
        id: 'revoke-access-undefined',
      },
    ];
    expect(actions).toEqual(permissionItems);
  });
});
