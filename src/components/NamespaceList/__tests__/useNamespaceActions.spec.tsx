import { renderHook } from '@testing-library/react';
import { NamespaceKind } from '~/types';
import { useNamespaceActions } from '../useNamespaceActions';

// Mock the modal launcher
const mockShowModal = jest.fn();
jest.mock('../../modal/ModalProvider', () => ({
  useModalLauncher: jest.fn(() => mockShowModal),
}));

// Mock the k8sCreateResource function
const mockK8sCreateResource = jest.fn();
jest.mock('../../../k8s/k8s-fetch', () => ({
  k8sCreateResource: jest.fn((...args: unknown[]) => mockK8sCreateResource(...args)),
}));

// Mock getUserDataFromLocalStorage
const mockGetUserDataFromLocalStorage = jest.fn();
jest.mock('../../../auth/utils', () => ({
  getUserDataFromLocalStorage: jest.fn(() => mockGetUserDataFromLocalStorage()),
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
    // Default mock responses
    mockGetUserDataFromLocalStorage.mockReturnValue({ preferredUsername: 'testuser' });
    mockK8sCreateResource.mockResolvedValue({
      status: { allowed: true },
    });
  });

  it('should return actions array, loading state, and toggle function', () => {
    const { result } = renderHook(() => useNamespaceActions(mockNamespace));

    expect(result.current).toHaveLength(3);
    expect(Array.isArray(result.current[0])).toBe(true);
    expect(typeof result.current[1]).toBe('boolean');
    expect(typeof result.current[2]).toBe('function');
  });

  it('should return manage visibility action enabled when user has permissions', () => {
    mockK8sCreateResource.mockResolvedValue({
      status: { allowed: true },
    });

    const { result } = renderHook(() => useNamespaceActions(mockNamespace));

    // Initially not checking permissions
    expect(result.current[0][0]).toEqual({
      cta: expect.any(Function),
      id: 'manage-visibility-test-namespace',
      label: 'Manage visibility',
      disabled: false,
      disabledTooltip: "You don't have permission to manage namespace visibility",
    });
  });

  it('should trigger permission check when toggle function is called', async () => {
    mockK8sCreateResource.mockResolvedValue({
      status: { allowed: true },
    });

    const { result } = renderHook(() => useNamespaceActions(mockNamespace));

    // Call the toggle function to trigger permission check
    result.current[2](true);

    // Wait for the permission check to complete
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(mockK8sCreateResource).toHaveBeenCalledTimes(2); // create and delete checks
  });

  it('should disable action when user lacks permissions', async () => {
    mockK8sCreateResource.mockResolvedValue({
      status: { allowed: false },
    });

    const { result } = renderHook(() => useNamespaceActions(mockNamespace));

    // Trigger permission check
    result.current[2](true);

    // Wait for the permission check to complete
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(result.current[0][0].disabled).toBe(true);
    expect(result.current[0][0].disabledTooltip).toBe(
      "You don't have permission to manage namespace visibility",
    );
  });

  it('should show loading state while checking permissions', async () => {
    // Mock a delayed response to simulate loading
    mockK8sCreateResource.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({ status: { allowed: true } }), 100)),
    );

    const { result } = renderHook(() => useNamespaceActions(mockNamespace));

    // Trigger permission check
    result.current[2](true);

    // Check loading state - need to wait for the async operation to start
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(result.current[1]).toBe(true); // isChecking should be true
  });

  it('should call modal launcher when action is triggered with permissions', async () => {
    mockK8sCreateResource.mockResolvedValue({
      status: { allowed: true },
    });

    const { result } = renderHook(() => useNamespaceActions(mockNamespace));

    // Trigger permission check first
    result.current[2](true);
    await new Promise((resolve) => setTimeout(resolve, 0));

    // Now call the action
    const action = result.current[0][0];
    if (typeof action.cta === 'function') {
      action.cta();
    }

    expect(mockShowModal).toHaveBeenCalledTimes(1);
  });

  it('should handle different namespaces correctly', () => {
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

    // Both should return actions with correct IDs
    expect(result1.current[0][0].id).toBe('manage-visibility-namespace-1');
    expect(result2.current[0][0].id).toBe('manage-visibility-namespace-2');
  });
});
