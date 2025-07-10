import { renderHook } from '@testing-library/react';
import { NamespaceKind } from '~/types';
import { mockAccessReviewUtil } from '../../../unit-test-utils/mock-access-review';
import { useNamespaceActions } from '../useNamespaceActions';

// Mock the modal launcher
const mockShowModal = jest.fn();
jest.mock('../../modal/ModalProvider', () => ({
  useModalLauncher: jest.fn(() => mockShowModal),
}));

// Mock the rbac hook using mockAccessReviewUtil
const mockUseAccessReviewForModel = mockAccessReviewUtil('useAccessReviewForModel');

const mockNamespace: NamespaceKind = {
  apiVersion: 'v1',
  kind: 'Namespace',
  metadata: {
    name: 'test-namespace',
    creationTimestamp: '2023-01-01T00:00:00Z',
  },
  spec: {},
  status: {},
};

describe('useNamespaceActions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default to having permissions (Admin user)
    mockUseAccessReviewForModel.mockReturnValue([true, true]);
  });

  it('should return manage visibility action enabled when user has permissions (Admin)', () => {
    // First call (create): return [true, true]
    // Second call (delete): return [true, true]
    mockUseAccessReviewForModel
      .mockReturnValueOnce([true, true]) // create permission
      .mockReturnValueOnce([true, true]); // delete permission

    const { result } = renderHook(() => useNamespaceActions(mockNamespace));

    expect(result.current).toHaveLength(1);
    expect(result.current[0]).toEqual({
      cta: expect.any(Function),
      id: 'manage-visibility-test-namespace',
      label: 'Manage visibility',
      disabled: false,
      disabledTooltip: undefined,
    });
  });

  it('should return manage visibility action disabled when user lacks create permissions', () => {
    // User can delete but not create RoleBindings
    // First call (create): return [false, true]
    // Second call (delete): return [true, true]
    mockUseAccessReviewForModel
      .mockReturnValueOnce([false, true]) // create permission (no access)
      .mockReturnValueOnce([true, true]); // delete permission (has access)

    const { result } = renderHook(() => useNamespaceActions(mockNamespace));

    expect(result.current).toHaveLength(1);
    expect(result.current[0]).toEqual({
      cta: expect.any(Function),
      id: 'manage-visibility-test-namespace',
      label: 'Manage visibility',
      disabled: true,
      disabledTooltip: "You don't have permission to manage namespace visibility",
    });
  });

  it('should return manage visibility action disabled when user lacks delete permissions', () => {
    // User can create but not delete RoleBindings
    // First call (create): return [true, true]
    // Second call (delete): return [false, true]
    mockUseAccessReviewForModel
      .mockReturnValueOnce([true, true]) // create permission
      .mockReturnValueOnce([false, true]); // delete permission

    const { result } = renderHook(() => useNamespaceActions(mockNamespace));

    expect(result.current).toHaveLength(1);
    expect(result.current[0]).toEqual({
      cta: expect.any(Function),
      id: 'manage-visibility-test-namespace',
      label: 'Manage visibility',
      disabled: true,
      disabledTooltip: "You don't have permission to manage namespace visibility",
    });
  });

  it('should return manage visibility action disabled when user has no RoleBinding permissions (Contributor/Maintainer)', () => {
    // User has no RoleBinding permissions
    // First call (create): return [false, true]
    // Second call (delete): return [false, true]
    mockUseAccessReviewForModel
      .mockReturnValueOnce([false, true]) // create permission (no access)
      .mockReturnValueOnce([false, true]); // delete permission (no access)

    const { result } = renderHook(() => useNamespaceActions(mockNamespace));

    expect(result.current).toHaveLength(1);
    expect(result.current[0]).toEqual({
      cta: expect.any(Function),
      id: 'manage-visibility-test-namespace',
      label: 'Manage visibility',
      disabled: true,
      disabledTooltip: "You don't have permission to manage namespace visibility",
    });
  });

  it('should call modal launcher when manage visibility action is triggered (when enabled)', () => {
    // First call (create): return [true, true]
    // Second call (delete): return [true, true]
    mockUseAccessReviewForModel
      .mockReturnValueOnce([true, true]) // create permission
      .mockReturnValueOnce([true, true]); // delete permission

    const { result } = renderHook(() => useNamespaceActions(mockNamespace));

    const manageVisibilityAction = result.current[0];
    if (typeof manageVisibilityAction.cta === 'function') {
      manageVisibilityAction.cta();
    }

    expect(mockShowModal).toHaveBeenCalledTimes(1);
    expect(mockShowModal).toHaveBeenCalledWith(expect.any(Function));
  });

  it('should handle different namespaces with permissions', () => {
    // Each namespace hook calls useAccessReviewForModel twice, so we need 4 mock calls total
    mockUseAccessReviewForModel
      .mockReturnValueOnce([true, true]) // namespace1 create permission
      .mockReturnValueOnce([true, true]) // namespace1 delete permission
      .mockReturnValueOnce([true, true]) // namespace2 create permission
      .mockReturnValueOnce([true, true]); // namespace2 delete permission

    const namespace1: NamespaceKind = {
      ...mockNamespace,
      metadata: { ...mockNamespace.metadata, name: 'namespace-1' },
    };

    const namespace2: NamespaceKind = {
      ...mockNamespace,
      metadata: { ...mockNamespace.metadata, name: 'namespace-2' },
    };

    const { result: result1 } = renderHook(() => useNamespaceActions(namespace1));
    const { result: result2 } = renderHook(() => useNamespaceActions(namespace2));

    // Both should return enabled actions
    expect(result1.current[0].label).toBe('Manage visibility');
    expect(result1.current[0].disabled).toBe(false);
    expect(result2.current[0].label).toBe('Manage visibility');
    expect(result2.current[0].disabled).toBe(false);

    // But they should have different IDs and be different functions
    expect(result1.current[0].id).toBe('manage-visibility-namespace-1');
    expect(result2.current[0].id).toBe('manage-visibility-namespace-2');
    expect(result1.current[0].cta).not.toBe(result2.current[0].cta);
  });

  it('should verify RoleBinding permissions are checked correctly', () => {
    // First call (create): return [true, true]
    // Second call (delete): return [true, true]
    mockUseAccessReviewForModel
      .mockReturnValueOnce([true, true]) // create permission
      .mockReturnValueOnce([true, true]); // delete permission

    const { result } = renderHook(() => useNamespaceActions(mockNamespace));

    // Verify the hook returned the expected action
    expect(result.current).toHaveLength(1);
    expect(result.current[0].label).toBe('Manage visibility');

    // Verify the hook was called twice (once for create, once for delete)
    expect(mockUseAccessReviewForModel).toHaveBeenCalledTimes(2);

    // Verify it's checking RoleBinding model permissions
    expect(mockUseAccessReviewForModel).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: 'RoleBinding',
        plural: 'rolebindings',
        apiGroup: 'rbac.authorization.k8s.io',
      }),
      'create',
    );

    expect(mockUseAccessReviewForModel).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: 'RoleBinding',
        plural: 'rolebindings',
        apiGroup: 'rbac.authorization.k8s.io',
      }),
      'delete',
    );
  });
});
