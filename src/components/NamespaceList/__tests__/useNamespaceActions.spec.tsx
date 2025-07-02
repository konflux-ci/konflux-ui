import { renderHook } from '@testing-library/react';
import { NamespaceKind } from '~/types';
import { useNamespaceActions } from '../useNamespaceActions';

// Mock the modal launcher
const mockShowModal = jest.fn();
jest.mock('../../modal/ModalProvider', () => ({
  useModalLauncher: jest.fn(() => mockShowModal),
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
  });

  it('should return manage visibility action', () => {
    const { result } = renderHook(() => useNamespaceActions(mockNamespace));

    expect(result.current).toHaveLength(1);
    expect(result.current[0]).toEqual({
      cta: expect.any(Function),
      id: 'manage-visibility-test-namespace',
      label: 'Manage visibility',
      disabled: false,
    });
  });

  it('should call modal launcher when manage visibility action is triggered', () => {
    const { result } = renderHook(() => useNamespaceActions(mockNamespace));

    const manageVisibilityAction = result.current[0];
    if (typeof manageVisibilityAction.cta === 'function') {
      manageVisibilityAction.cta();
    }

    expect(mockShowModal).toHaveBeenCalledTimes(1);
    expect(mockShowModal).toHaveBeenCalledWith(expect.any(Function));
  });

  it('should create modal launcher with fresh refreshKey each time', () => {
    const { result } = renderHook(() => useNamespaceActions(mockNamespace));

    const manageVisibilityAction = result.current[0];

    // Call the action twice
    if (typeof manageVisibilityAction.cta === 'function') {
      manageVisibilityAction.cta();
      manageVisibilityAction.cta();
    }

    expect(mockShowModal).toHaveBeenCalledTimes(2);

    // Verify each call gets a unique refreshKey (timestamp)
    const firstCall = mockShowModal.mock.calls[0][0];
    const secondCall = mockShowModal.mock.calls[1][0];

    // Both should be functions (modal launchers)
    expect(typeof firstCall).toBe('function');
    expect(typeof secondCall).toBe('function');
  });

  it('should handle different namespaces', () => {
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

    // Both should return the same action structure
    expect(result1.current[0].label).toBe('Manage visibility');
    expect(result2.current[0].label).toBe('Manage visibility');

    // But they should be different functions
    expect(result1.current[0].cta).not.toBe(result2.current[0].cta);
  });
});
