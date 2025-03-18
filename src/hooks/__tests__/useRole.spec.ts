import { renderHook } from '@testing-library/react-hooks';
import { defaultKonfluxRoleMap, MockInfo } from '../../__data__/role-data';
import { useKonfluxPublicInfo } from '../useKonfluxPublicInfo';
import { useRoleMap } from '../useRole';

jest.mock('../useKonfluxPublicInfo', () => ({
  useKonfluxPublicInfo: jest.fn(),
}));

describe('useRoleMap', () => {
  const mockUseKonfluxPublicInfo = useKonfluxPublicInfo as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });
  it('should return loading state initially', () => {
    mockUseKonfluxPublicInfo.mockReturnValue([{}, false, null]);

    const { result } = renderHook(() => useRoleMap());
    expect(result.current[0]).toEqual(undefined);
    expect(result.current[1]).toBe(false);
    expect(result.current[2]).toBeNull();
  });

  it('should handle error state correctly', () => {
    mockUseKonfluxPublicInfo.mockReturnValue([{}, true, 'Error occurred']);

    const { result } = renderHook(() => useRoleMap());
    expect(result.current[0]).toEqual(undefined);
    expect(result.current[1]).toBe(true);
    expect(result.current[2]).toBe('Error occurred');
  });

  it('should transform and return role map correctly when data is available', () => {
    mockUseKonfluxPublicInfo.mockReturnValue([MockInfo, true, null]);

    const { result } = renderHook(() => useRoleMap());
    expect(result.current[0]).toEqual(defaultKonfluxRoleMap);
    expect(result.current[1]).toBe(true);
    expect(result.current[2]).toBeNull();
  });

  it('should handle empty info gracefully', () => {
    mockUseKonfluxPublicInfo.mockReturnValue([{}, true, null]);

    const { result } = renderHook(() => useRoleMap());
    // Ensure that even with malformed JSON, the role map is still empty
    expect(result.current[0]).toEqual({
      roleDescription: {},
      roleKind: undefined,
      roleMap: {},
    });
    expect(result.current[1]).toBe(true);
    expect(result.current[2]).toBeNull();
  });

  it('should memoize the role map transformation', () => {
    mockUseKonfluxPublicInfo.mockReturnValue([MockInfo, true, null]);
    const { result, rerender } = renderHook(() => useRoleMap());
    const initialRoleMap = result.current[0];
    // Rerender with the same props and check if memoization works (no change)
    rerender();
    expect(result.current[0]).toBe(initialRoleMap); // Role map should not change

    mockUseKonfluxPublicInfo.mockReturnValue([{}, true, null]);
    rerender();
    // Role map should have changed
    expect(result.current[0]).not.toBe(initialRoleMap);
  });
});
