import { renderHook } from '@testing-library/react';
import { defaultKonfluxRoleMap } from '../../__data__/role-data';
import { mockRoleBindings, mockRoleBinding } from '../../__data__/rolebinding-data';
import { createK8sUtilMock } from '../../utils/test-utils';
import { useRoleMap } from '../useRole';
import { useRoleBindings, useRoleBinding } from '../useRoleBindings';

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

    mockUseRoleMap.mockReturnValue([{}, true]);
    const { result } = renderHook(() => useRoleBindings(mockNamespace));
    expect(result.current[0]).toEqual([]);
    expect(result.current[1]).toBe(false);
  });

  it('should return filtered bindings when roleMap is ready', () => {
    k8sWatchMock.mockReturnValue({
      data: [mockRoleBinding],
      isLoading: false,
    });

    mockUseRoleMap.mockReturnValue([defaultKonfluxRoleMap, true]);

    const { result } = renderHook(() => useRoleBindings(mockNamespace));

    expect(result.current[0]).toEqual([mockRoleBinding]);
    expect(result.current[1]).toBe(true);
  });

  it('should return an empty array if roleMap is empty', () => {
    k8sWatchMock.mockReturnValue({
      data: mockRoleBindings,
      isLoading: false,
      error: null,
    });

    mockUseRoleMap.mockReturnValue([{}, true]);

    const { result } = renderHook(() => useRoleBindings(mockNamespace));
    expect(result.current[0]).toEqual([]);
  });

  it('should handle error state in bindings', () => {
    k8sWatchMock.mockReturnValue({
      data: [],
      isLoading: false,
      error: 'Error fetching role bindings',
    });

    mockUseRoleMap.mockReturnValue([defaultKonfluxRoleMap, true]);
    const { result } = renderHook(() => useRoleBindings(mockNamespace));
    expect(result.current[2]).toBe('Error fetching role bindings');
  });

  it('should handle error state in roleMap', () => {
    k8sWatchMock.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    });

    mockUseRoleMap.mockReturnValue([defaultKonfluxRoleMap, true, 'Error fetching roleMap']);
    const { result } = renderHook(() => useRoleBindings(mockNamespace));
    expect(result.current[2]).toBe('Error fetching roleMap');
  });

  it('should not filter role bindings while roleMap is loading', () => {
    k8sWatchMock.mockReturnValue({
      data: mockRoleBindings,
      isLoading: false,
      error: null,
    });

    mockUseRoleMap.mockReturnValue([{}, true]);
    const { result } = renderHook(() => useRoleBindings(mockNamespace));
    expect(result.current[0]).toEqual([]);
  });
});

describe('useRoleBinding', () => {
  const mockNamespace = 'test-ns';
  const mockUseRoleMap = useRoleMap as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return undefined when bindings are loading', () => {
    k8sWatchMock.mockReturnValue({
      data: {},
      isLoading: true,
      error: null,
    });

    mockUseRoleMap.mockReturnValue([{}, true]);
    const { result } = renderHook(() => useRoleBinding(mockNamespace, 'test'));
    expect(result.current[0]).toEqual(undefined);
    expect(result.current[1]).toBe(false);
  });

  it('should return binding when roleMap is ready', () => {
    k8sWatchMock.mockReturnValue({
      data: mockRoleBinding,
      isLoading: false,
    });

    mockUseRoleMap.mockReturnValue([defaultKonfluxRoleMap, true]);

    const { result } = renderHook(() =>
      useRoleBinding(mockNamespace, mockRoleBinding.metadata.name),
    );

    expect(result.current[0]).toEqual(mockRoleBinding);
    expect(result.current[1]).toBe(true);
  });

  it('should return undefined if roleMap is empty', () => {
    k8sWatchMock.mockReturnValue({
      data: mockRoleBinding,
      isLoading: false,
      error: null,
    });

    mockUseRoleMap.mockReturnValue([{}, true]);

    const { result } = renderHook(() =>
      useRoleBinding(mockNamespace, mockRoleBinding.metadata.name),
    );
    expect(result.current[0]).toEqual(undefined);
  });

  it('should handle error state in binding', () => {
    k8sWatchMock.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: 'Error fetching role binding',
    });

    mockUseRoleMap.mockReturnValue([defaultKonfluxRoleMap, true]);
    const { result } = renderHook(() =>
      useRoleBinding(mockNamespace, mockRoleBinding.metadata.name),
    );
    expect(result.current[2]).toBe('Error fetching role binding');
  });

  it('should handle error state in roleMap', () => {
    k8sWatchMock.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
    });

    mockUseRoleMap.mockReturnValue([defaultKonfluxRoleMap, true, 'Error fetching roleMap']);
    const { result } = renderHook(() =>
      useRoleBinding(mockNamespace, mockRoleBinding.metadata.name),
    );
    expect(result.current[2]).toBe('Error fetching roleMap');
  });

  it('should return undefined while roleMap is loading', () => {
    k8sWatchMock.mockReturnValue({
      data: mockRoleBinding,
      isLoading: false,
      error: null,
    });

    mockUseRoleMap.mockReturnValue([{}, false]);
    const { result } = renderHook(() =>
      useRoleBinding(mockNamespace, mockRoleBinding.metadata.name),
    );
    expect(result.current[0]).toEqual(undefined);
  });
});
