import { renderHook } from '@testing-library/react';
import { NamespaceKind } from '~/types';
import { useNamespaceActions } from '../useNamespaceActions';

// Mock the modal launcher
const mockShowModal = jest.fn();
jest.mock('../../modal/ModalProvider', () => ({
  useModalLauncher: jest.fn(() => mockShowModal),
}));

// Mock the rbac hook - useAccessReview returns [allowed, loaded]
const mockUseAccessReview = jest.fn();
jest.mock('../../../utils/rbac', () => ({
  useAccessReview: jest.fn(() => mockUseAccessReview()),
}));

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
    // Default to having permissions loaded and allowed
    mockUseAccessReview.mockReturnValue([true, true]);
  });

  it('should return manage visibility action enabled when user has permissions', () => {
    // Mock both create and delete permissions as allowed and loaded
    mockUseAccessReview
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

  it('should return manage visibility action disabled when user lacks create permission', () => {
    mockUseAccessReview
      .mockReturnValueOnce([false, true]) // create permission denied
      .mockReturnValueOnce([true, true]); // delete permission allowed

    const { result } = renderHook(() => useNamespaceActions(mockNamespace));

    expect(result.current[0]).toEqual({
      cta: expect.any(Function),
      id: 'manage-visibility-test-namespace',
      label: 'Manage visibility',
      disabled: true,
      disabledTooltip: "You don't have permission to manage namespace visibility",
    });
  });

  it('should return manage visibility action disabled when user lacks delete permission', () => {
    mockUseAccessReview
      .mockReturnValueOnce([true, true]) // create permission allowed
      .mockReturnValueOnce([false, true]); // delete permission denied

    const { result } = renderHook(() => useNamespaceActions(mockNamespace));

    expect(result.current[0]).toEqual({
      cta: expect.any(Function),
      id: 'manage-visibility-test-namespace',
      label: 'Manage visibility',
      disabled: true,
      disabledTooltip: "You don't have permission to manage namespace visibility",
    });
  });

  it('should return manage visibility action disabled when user lacks both permissions', () => {
    mockUseAccessReview
      .mockReturnValueOnce([false, true]) // create permission denied
      .mockReturnValueOnce([false, true]); // delete permission denied

    const { result } = renderHook(() => useNamespaceActions(mockNamespace));

    expect(result.current[0]).toEqual({
      cta: expect.any(Function),
      id: 'manage-visibility-test-namespace',
      label: 'Manage visibility',
      disabled: true,
      disabledTooltip: "You don't have permission to manage namespace visibility",
    });
  });

  it('should show loading state when permissions are not yet loaded', () => {
    mockUseAccessReview
      .mockReturnValueOnce([false, false]) // create permission loading
      .mockReturnValueOnce([false, false]); // delete permission loading

    const { result } = renderHook(() => useNamespaceActions(mockNamespace));

    expect(result.current[0]).toEqual({
      cta: expect.any(Function),
      id: 'manage-visibility-test-namespace',
      label: 'Manage visibility',
      disabled: true,
      disabledTooltip: 'Loading permissions...',
    });
  });

  it('should show loading state when only one permission is loaded', () => {
    mockUseAccessReview
      .mockReturnValueOnce([true, true]) // create permission loaded
      .mockReturnValueOnce([false, false]); // delete permission still loading

    const { result } = renderHook(() => useNamespaceActions(mockNamespace));

    expect(result.current[0]).toEqual({
      cta: expect.any(Function),
      id: 'manage-visibility-test-namespace',
      label: 'Manage visibility',
      disabled: true,
      disabledTooltip: 'Loading permissions...',
    });
  });

  it('should call the modal launcher when action is triggered', () => {
    mockUseAccessReview
      .mockReturnValueOnce([true, true]) // create permission
      .mockReturnValueOnce([true, true]); // delete permission

    const { result } = renderHook(() => useNamespaceActions(mockNamespace));

    // Call the action's cta function
    const action = result.current[0];
    if (typeof action.cta === 'function') {
      action.cta();
    }

    expect(mockShowModal).toHaveBeenCalledTimes(1);
    expect(mockShowModal).toHaveBeenCalledWith(expect.any(Function));
  });

  it('should handle different namespaces with permissions', () => {
    const namespace1: NamespaceKind = {
      ...mockNamespace,
      metadata: { ...mockNamespace.metadata, name: 'namespace-1' },
    };

    const namespace2: NamespaceKind = {
      ...mockNamespace,
      metadata: { ...mockNamespace.metadata, name: 'namespace-2' },
    };

    // Each namespace hook calls useAccessReview twice, so we need 4 mock calls total
    mockUseAccessReview
      .mockReturnValueOnce([true, true]) // namespace1 create permission
      .mockReturnValueOnce([true, true]) // namespace1 delete permission
      .mockReturnValueOnce([true, true]) // namespace2 create permission
      .mockReturnValueOnce([true, true]); // namespace2 delete permission

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
});
