import { runStatus } from '~/consts/pipelinerun';
import { useCurrentTime } from '~/shared/hooks/useCurrentTime';
import { KueueQueuePosition } from './types';

/**
 * Formats a queue wait duration from a creationTimestamp to the current time.
 * Shows compact format: "5m", "2h 15m". Omits seconds to reduce noise.
 * Returns `undefined` when no timestamp is available.
 */
export const formatQueueWaitTime = (
  creationTimestamp: string | undefined,
  now: number,
): string | undefined => {
  if (!creationTimestamp) return undefined;

  const start = new Date(creationTimestamp).getTime();
  if (Number.isNaN(start)) return undefined;

  const diffMs = now - start;
  if (diffMs <= 0) return undefined;

  const totalMinutes = Math.floor(diffMs / 60_000);
  if (totalMinutes < 1) return 'just now';

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours > 0) {
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  }
  return `${minutes}m`;
};

/**
 * Builds the compact queue position label appended to the "Queued" status.
 *
 * Format: `Queued #N - Xm` where N is the 1-based cluster-queue position and
 * Xm is the wall-clock wait time. When wait time is unavailable, `Queued #N`.
 */
export const buildQueueStatusText = (
  queuePosition: KueueQueuePosition,
  now: number,
): string => {
  const position = `#${queuePosition.positionInClusterQueue + 1}`;
  const waitTime = formatQueueWaitTime(queuePosition.creationTimestamp, now);
  return waitTime ? `Queued ${position} - ${waitTime}` : `Queued ${position}`;
};

/**
 * Returns a combined status label like `"Queued #3 - 5m"` when the PipelineRun
 * is queued and queue position data is available, otherwise `undefined`.
 *
 * Designed to be passed as the `text` prop to `StatusIconWithText` so the queue
 * position appears as a single, unified status label rather than a disconnected
 * secondary element.
 *
 * Returns `undefined` (use default status label) when:
 * - The PipelineRun is not in `Queued` status
 * - `queuePosition` is `undefined` (feature flag off, Kueue unavailable, etc.)
 */
export const useQueueStatusText = (
  status: runStatus,
  queuePosition: KueueQueuePosition | undefined,
): string | undefined => {
  const isQueued = status === runStatus.Queued && !!queuePosition;
  const now = useCurrentTime(isQueued);

  if (!isQueued || !queuePosition) return undefined;

  return buildQueueStatusText(queuePosition, now);
};
