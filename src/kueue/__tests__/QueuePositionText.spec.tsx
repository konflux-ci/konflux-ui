import { renderHook } from '@testing-library/react';
import { runStatus } from '~/consts/pipelinerun';
import {
  buildQueueStatusText,
  formatQueueWaitTime,
  useQueueStatusText,
} from '../QueuePositionText';
import { KueueQueuePosition } from '../types';

// Freeze `useCurrentTime` to a known instant so wait-time assertions are deterministic.
const NOW = new Date('2026-10-20T10:00:00Z').getTime();
jest.mock('~/shared/hooks/useCurrentTime', () => ({
  useCurrentTime: () => NOW,
}));

const createQueuePosition = (
  overrides: Partial<KueueQueuePosition> = {},
): KueueQueuePosition => ({
  positionInClusterQueue: 2,
  positionInLocalQueue: 0,
  priority: 700,
  creationTimestamp: '2026-10-20T09:55:00Z',
  ...overrides,
});

describe('formatQueueWaitTime', () => {
  it('returns undefined when creationTimestamp is undefined', () => {
    expect(formatQueueWaitTime(undefined, NOW)).toBeUndefined();
  });

  it('returns undefined for an invalid timestamp', () => {
    expect(formatQueueWaitTime('not-a-date', NOW)).toBeUndefined();
  });

  it('returns undefined when the timestamp is in the future', () => {
    expect(formatQueueWaitTime('2026-10-20T10:05:00Z', NOW)).toBeUndefined();
  });

  it('returns "just now" for durations under 1 minute', () => {
    expect(formatQueueWaitTime('2026-10-20T09:59:30Z', NOW)).toBe('just now');
  });

  it('returns minutes for short waits', () => {
    expect(formatQueueWaitTime('2026-10-20T09:55:00Z', NOW)).toBe('5m');
  });

  it('returns hours and minutes for long waits', () => {
    expect(formatQueueWaitTime('2026-10-20T07:45:00Z', NOW)).toBe('2h 15m');
  });

  it('omits minutes when wait is exactly N hours', () => {
    expect(formatQueueWaitTime('2026-10-20T08:00:00Z', NOW)).toBe('2h');
  });
});

describe('buildQueueStatusText', () => {
  it('includes "Queued", position, and wait time', () => {
    const pos = createQueuePosition();
    expect(buildQueueStatusText(pos, NOW)).toBe('Queued #3 - 5m');
  });

  it('uses 1-based position (positionInClusterQueue + 1)', () => {
    const pos = createQueuePosition({ positionInClusterQueue: 0 });
    expect(buildQueueStatusText(pos, NOW)).toBe('Queued #1 - 5m');
  });

  it('shows only "Queued #N" when creationTimestamp is missing', () => {
    const pos = createQueuePosition({ creationTimestamp: undefined });
    expect(buildQueueStatusText(pos, NOW)).toBe('Queued #3');
  });

  it('shows "just now" for sub-minute waits', () => {
    const pos = createQueuePosition({ creationTimestamp: '2026-10-20T09:59:45Z' });
    expect(buildQueueStatusText(pos, NOW)).toBe('Queued #3 - just now');
  });
});

describe('useQueueStatusText', () => {
  it('returns combined text when status is Queued and queuePosition is available', () => {
    const pos = createQueuePosition();
    const { result } = renderHook(() => useQueueStatusText(runStatus.Queued, pos));
    expect(result.current).toBe('Queued #3 - 5m');
  });

  it('returns undefined when status is not Queued', () => {
    const pos = createQueuePosition();
    const { result } = renderHook(() => useQueueStatusText(runStatus.Running, pos));
    expect(result.current).toBeUndefined();
  });

  it('returns undefined when queuePosition is undefined', () => {
    const { result } = renderHook(() => useQueueStatusText(runStatus.Queued, undefined));
    expect(result.current).toBeUndefined();
  });

  it('returns undefined when status is Pending (not Queued)', () => {
    const pos = createQueuePosition();
    const { result } = renderHook(() => useQueueStatusText(runStatus.Pending, pos));
    expect(result.current).toBeUndefined();
  });
});
