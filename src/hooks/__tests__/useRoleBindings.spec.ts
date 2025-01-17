import { renderHook } from '@testing-library/react';
import { defaultKonfluxRoleMap } from '../../__data__/role-data';
import { mockRoleBindings, mockRoleBinding } from '../../__data__/rolebinding-data';
import { createK8sUtilMock } from '../../utils/test-utils';
import { useRoleMap } from '../useRole';
import { useRoleBindings } from '../useRoleBindings';

const k8sWatchMock = createK8sUtilMock('useK8sWatchResource');
jest.mock('../useRole', () => ({
  useRoleMap: jest.fn(),
}));

describe('useRoleBindings', () => {
  const mockNamespace = 'test-ns';
  const mockUseRoleMap = useRoleMap as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return an empty array when bindings are loading', () => {
    k8sWatchMock.mockReturnValue({
      data: [],
      isLoading: true,
      error: null,
    });

    mockUseRoleMap.mockReturnValue([{}, false]);
    const { result } = renderHook(() => useRoleBindings(mockNamespace, true));
    expect(result.current[0]).toEqual([]);
    expect(result.current[1]).toBe(true);
  });

  it('should return filtered bindings when roleMap is ready', () => {
    k8sWatchMock.mockReturnValue({
      data: [mockRoleBinding],
      isLoading: false,
    });

    mockUseRoleMap.mockReturnValue([defaultKonfluxRoleMap, false]);

    const { result } = renderHook(() => useRoleBindings(mockNamespace, true));

    expect(result.current[0]).toEqual([mockRoleBinding]);
    expect(result.current[1]).toBe(false); // not loading
  });

  it('should return an empty array if roleMap is empty', () => {
    k8sWatchMock.mockReturnValue({
      data: mockRoleBindings,
      isLoading: false,
      error: null,
    });

    mockUseRoleMap.mockReturnValue([{}, false]);

    const { result } = renderHook(() => useRoleBindings(mockNamespace, true));
    expect(result.current[0]).toEqual([]);
  });

  it('should handle error state in bindings', () => {
    k8sWatchMock.mockReturnValue({
      data: [],
      isLoading: false,
      error: 'Error fetching role bindings',
    });

    mockUseRoleMap.mockReturnValue([defaultKonfluxRoleMap, false]);
    const { result } = renderHook(() => useRoleBindings(mockNamespace, true));
    expect(result.current[2]).toBe('Error fetching role bindings');
  });

  it('should handle error state in roleMap', () => {
    k8sWatchMock.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    });

    mockUseRoleMap.mockReturnValue([defaultKonfluxRoleMap, false, 'Error fetching roleMap']);
    const { result } = renderHook(() => useRoleBindings(mockNamespace, true));
    expect(result.current[2]).toBe('Error fetching roleMap');
  });

  it('should not filter role bindings while roleMap is loading', () => {
    k8sWatchMock.mockReturnValue({
      data: mockRoleBindings,
      isLoading: false,
      error: null,
    });

    mockUseRoleMap.mockReturnValue([{}, true]);
    const { result } = renderHook(() => useRoleBindings(mockNamespace, true));
    expect(result.current[0]).toEqual([]);
  });
});
