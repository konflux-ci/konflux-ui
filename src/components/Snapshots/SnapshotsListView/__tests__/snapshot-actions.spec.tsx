import { renderHook } from '@testing-library/react';
import { useNamespace } from '~/shared/providers/Namespace';
import { ResourceSource } from '~/types/k8s';
import { mockSnapshot } from '../../../../__data__/mock-snapshots';
import { useAccessReviewForModel } from '../../../../utils/rbac';
import { useSnapshotActions } from '../snapshot-actions';

jest.mock('../../../../utils/rbac', () => ({
  useAccessReviewForModel: jest.fn(),
}));

jest.mock('~/shared/providers/Namespace', () => ({
  useNamespace: jest.fn(),
}));

const useAccessReviewForModelMock = useAccessReviewForModel as jest.Mock;
const useNamespaceMock = useNamespace as jest.Mock;

describe('useSnapshotActions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useNamespaceMock.mockReturnValue('test-namespace');
    useAccessReviewForModelMock.mockReturnValue([true, true]);
  });

  it('should enable trigger release action for cluster snapshot when user has permissions', () => {
    const { result } = renderHook(() => useSnapshotActions(mockSnapshot, ResourceSource.Cluster));

    expect(result.current).toHaveLength(1);
    const action = result.current[0];
    expect(action.id).toBe(`trigger-release-${mockSnapshot.metadata.name}`);
    expect(action.label).toBe('Trigger release');
    expect(action.disabled).toBe(false);
    expect(action.disabledTooltip).toBeUndefined();
    expect(action.cta).toHaveProperty('href');
    expect(typeof action.cta === 'object' && action.cta?.href).toContain(
      mockSnapshot.metadata.name,
    );
  });

  it('should disable trigger release action for archived snapshot even when user has permissions', () => {
    const { result } = renderHook(() => useSnapshotActions(mockSnapshot, ResourceSource.Archive));

    expect(result.current).toHaveLength(1);
    const action = result.current[0];
    expect(action.id).toBe(`trigger-release-${mockSnapshot.metadata.name}`);
    expect(action.label).toBe('Trigger release');
    expect(action.disabled).toBe(true);
    expect(action.disabledTooltip).toBe('Cannot trigger release from archived snapshot');
    expect(typeof action.cta).toBe('function');
  });

  it('should disable trigger release action when user lacks permissions', () => {
    useAccessReviewForModelMock.mockReturnValue([false, false]);

    const { result } = renderHook(() => useSnapshotActions(mockSnapshot, ResourceSource.Cluster));

    expect(result.current).toHaveLength(1);
    const action = result.current[0];
    expect(action.disabled).toBe(true);
    expect(action.disabledTooltip).toBe("You don't have access to trigger releases");
  });

  it('should not set href for archived snapshots', () => {
    const { result } = renderHook(() => useSnapshotActions(mockSnapshot, ResourceSource.Archive));

    const action = result.current[0];
    expect(typeof action.cta).toBe('function');
    expect(action.cta).not.toHaveProperty('href');
  });

  it('should disable trigger release action when source is undefined (defensive)', () => {
    const { result } = renderHook(() => useSnapshotActions(mockSnapshot, undefined));

    expect(result.current).toHaveLength(1);
    const action = result.current[0];
    expect(action.disabled).toBe(true);
    expect(action.disabledTooltip).toBe('Cannot trigger release from archived snapshot');
  });

  it('should return empty actions when snapshot is null', () => {
    const { result } = renderHook(() => useSnapshotActions(null, ResourceSource.Cluster));

    expect(result.current).toEqual([]);
  });

  it('should include correct analytics data', () => {
    const { result } = renderHook(() => useSnapshotActions(mockSnapshot, ResourceSource.Cluster));

    const action = result.current[0];
    expect(action.analytics).toEqual({
      link_name: 'trigger-release-snapshot',
      link_location: 'snapshot-actions',
      snapshot_name: mockSnapshot.metadata.name,
      namespace: 'test-namespace',
    });
  });
});
