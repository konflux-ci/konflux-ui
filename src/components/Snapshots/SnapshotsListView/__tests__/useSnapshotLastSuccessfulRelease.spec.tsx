import { renderHook } from '@testing-library/react';
import { useApplicationReleases } from '~/hooks/useApplicationReleases';
import { ReleaseCondition, ReleaseKind } from '~/types';
import { useSnapshotLastSuccessfulRelease } from '../useSnapshotLastSuccessfulRelease';

jest.mock('~/hooks/useApplicationReleases');

const mockedUseApplicationReleases = useApplicationReleases as jest.Mock;

type ReleasedCond = {
  type: ReleaseCondition;
  status: 'True' | 'False' | 'Unknown';
  reason?: string;
  lastTransitionTime?: string;
};

const buildRelease = (overrides: Partial<ReleaseKind> = {}): ReleaseKind => ({
  apiVersion: 'appstudio.redhat.com/v1alpha1',
  kind: 'Release',
  metadata: {
    name: 'r',
    creationTimestamp: '2023-01-01T00:00:00Z',
    ...(overrides.metadata || {}),
  },
  spec: {
    releasePlan: 'rp',
    snapshot: 'snap-a',
    ...(overrides.spec || {}),
  },
  status: overrides.status,
});

describe('useSnapshotLastSuccessfulRelease', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns null while not loaded', () => {
    mockedUseApplicationReleases.mockReturnValue([[], false, undefined]);
    const { result } = renderHook(() => useSnapshotLastSuccessfulRelease('app-x', 'snap-a'));
    expect(result.current[0]).toBeNull();
    expect(result.current[1]).toBe(false);
    expect(result.current[2]).toBeUndefined();
  });

  it('returns null and propagates error when error present', () => {
    const error = new Error('boom');
    mockedUseApplicationReleases.mockReturnValue([[], true, error]);
    const { result } = renderHook(() => useSnapshotLastSuccessfulRelease('app-x', 'snap-a'));
    expect(result.current[0]).toBeNull();
    expect(result.current[1]).toBe(true);
    expect(result.current[2]).toBe(error);
  });

  it('filters by snapshot and only counts successful Released condition', () => {
    const okRelease = buildRelease({
      metadata: { name: 'ok1', creationTimestamp: '2023-01-02T00:00:00Z' },
      spec: { releasePlan: 'rp', snapshot: 'snap-a' },
      status: {
        conditions: [{ type: ReleaseCondition.Released, status: 'True', reason: 'Succeeded' }],
      },
    });
    const otherSnapshot = buildRelease({
      metadata: { name: 'nope' },
      spec: { releasePlan: 'rp', snapshot: 'snap-b' },
      status: {
        conditions: [{ type: ReleaseCondition.Released, status: 'True', reason: 'Succeeded' }],
      },
    });
    const failed = buildRelease({
      metadata: { name: 'failed' },
      spec: { releasePlan: 'rp', snapshot: 'snap-a' },
      status: {
        conditions: [{ type: ReleaseCondition.Released, status: 'False', reason: 'Failed' }],
      },
    });

    mockedUseApplicationReleases.mockReturnValue([
      [okRelease, otherSnapshot, failed],
      true,
      undefined,
    ]);

    const { result } = renderHook(() => useSnapshotLastSuccessfulRelease('app-x', 'snap-a'));
    expect(result.current[0]?.metadata?.name).toBe('ok1');
    expect(result.current[1]).toBe(true);
    expect(result.current[2]).toBeUndefined();
  });

  it('sorts by lastTransitionTime when present, else creationTimestamp, picking most recent', () => {
    const olderByCreation = buildRelease({
      metadata: { name: 'old-creation', creationTimestamp: '2023-01-01T00:00:00Z' },
      status: {
        conditions: [
          {
            type: ReleaseCondition.Released,
            status: 'True',
            reason: 'Succeeded',
            // no lastTransitionTime here
          } as ReleasedCond,
        ],
      },
    });

    const newerByCreation = buildRelease({
      metadata: { name: 'new-creation', creationTimestamp: '2023-01-03T00:00:00Z' },
      status: {
        conditions: [{ type: ReleaseCondition.Released, status: 'True', reason: 'Succeeded' }],
      },
    });

    const lastTransitionWinner = buildRelease({
      metadata: { name: 'last-transition', creationTimestamp: '2023-01-02T00:00:00Z' },
      status: {
        conditions: [
          {
            type: ReleaseCondition.Released,
            status: 'True',
            reason: 'Succeeded',
            lastTransitionTime: '2023-01-04T00:00:00Z',
          } as ReleasedCond,
        ],
      },
    });

    mockedUseApplicationReleases.mockReturnValue([
      [olderByCreation, newerByCreation, lastTransitionWinner],
      true,
      undefined,
    ]);

    const { result } = renderHook(() => useSnapshotLastSuccessfulRelease('app-x', 'snap-a'));
    expect(result.current[0]?.metadata?.name).toBe('last-transition');
  });
});
