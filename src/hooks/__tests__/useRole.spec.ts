import { renderHook } from '@testing-library/react-hooks';
import { defaultKonfluxRoleMap, MockInfo } from '../../__data__/role-data';
import { useKonfluxPublicInfo } from '../useKonfluxPublicInfo';
import { buildRoleRefWeightsFromRbacItems, useRoleMap } from '../useRole';

jest.mock('../useKonfluxPublicInfo', () => ({
  useKonfluxPublicInfo: jest.fn(),
}));

describe('buildRoleRefWeightsFromRbacItems', () => {
  it('assigns higher weight to earlier rbac entries (more privileged first)', () => {
    expect(buildRoleRefWeightsFromRbacItems(MockInfo.rbac)).toEqual(
      defaultKonfluxRoleMap.roleRefWeights,
    );
  });

  it('includes weights for roles added later in the rbac list', () => {
    const rbacWithViewer = [
      ...MockInfo.rbac,
      {
        displayName: 'viewer',
        description: 'Read-only access',
        roleRef: {
          apiGroup: 'rbac.authorization.k8s.io',
          kind: 'ClusterRole',
          name: 'konflux-viewer-user-actions',
        },
      },
    ];
    expect(buildRoleRefWeightsFromRbacItems(rbacWithViewer)).toEqual({
      'konflux-admin-user-actions': 4,
      'konflux-maintainer-user-actions': 3,
      'konflux-contributor-user-actions': 2,
      'konflux-viewer-user-actions': 1,
    });
  });
});

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
      roleRefWeights: {},
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
