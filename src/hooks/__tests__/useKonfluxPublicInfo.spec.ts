import { renderHook } from '@testing-library/react-hooks';
import { MockInfo, invalidMockConfigMap, mockConfigMap } from '../../__data__/role-data';
import { createK8sUtilMock } from '../../utils/test-utils';
import { useKonfluxPublicInfo } from '../useKonfluxPublicInfo';

const k8sWatchMock = createK8sUtilMock('useK8sWatchResource');

describe('useKonfluxPublicInfo', () => {
  it('should return loading state initially', () => {
    k8sWatchMock.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    });

    const { result } = renderHook(() => useKonfluxPublicInfo());

    expect(result.current[0]).toEqual({});
    expect(result.current[1]).toBe(false);
    expect(result.current[2]).toBeNull();
  });

  it('should handle error state correctly', () => {
    k8sWatchMock.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: 'Error occurred',
    });

    const { result } = renderHook(() => useKonfluxPublicInfo());

    expect(result.current[0]).toEqual({});
    expect(result.current[1]).toBe(true);
    expect(result.current[2]).toBe('Error occurred');
  });

  it('should get info.json correctly when data is available', () => {
    k8sWatchMock.mockReturnValue({
      data: mockConfigMap,
      isLoading: false,
      error: null,
    });

    const { result } = renderHook(() => useKonfluxPublicInfo());

    expect(result.current[0]).toEqual(expect.objectContaining(MockInfo));
    expect(result.current[1]).toBe(true);
    expect(result.current[2]).toBeNull();
  });

  it('should handle malformed JSON gracefully', () => {
    k8sWatchMock.mockReturnValue({
      data: invalidMockConfigMap,
      isLoading: false,
      error: null,
    });

    const { result } = renderHook(() => useKonfluxPublicInfo());

    // Ensure that even with malformed JSON, the role map is still empty
    expect(result.current[0]).toEqual({});
    expect(result.current[1]).toBe(true);
    expect(result.current[2]).toBeNull();
  });

  it('should memoize the infoJson', () => {
    k8sWatchMock.mockReturnValue({
      data: mockConfigMap,
      isLoading: false,
      error: null,
    });

    const { result, rerender } = renderHook(() => useKonfluxPublicInfo());

    const initiaInfoJson = result.current[0];

    // Rerender with the same props and check if memoization works (no change)
    rerender();
    expect(result.current[0]).toBe(initiaInfoJson); // Role map should not change

    // Mock the hook again with the updated configMap
    k8sWatchMock.mockReturnValue({
      data: invalidMockConfigMap,
      isLoading: false,
      error: null,
    });

    rerender();
    // infoJson should have changed
    expect(result.current[0]).not.toBe(initiaInfoJson);
  });
});
