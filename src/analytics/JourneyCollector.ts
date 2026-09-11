import { v4 as uuidv4 } from 'uuid';
import { analyticsService } from './AnalyticsService';
import { CommonFields, JourneyStep, TrackEvents, UserJourneyEvent } from './gen/analytics-types';

// Leave headroom below Amplitude's ~100KB array-property limit.
export const MAX_PAYLOAD_BYTES = 80 * 1024;

interface OpenStep {
  pagePattern: string;
  enteredAt: number;
}

type JourneySnapshot = Omit<UserJourneyEvent, keyof CommonFields | 'userId'>;

export class JourneyCollector {
  private static readonly FLUSH_DEDUPE_WINDOW_MS = 1000;

  private static readonly PAYLOAD_OVERHEAD_BYTES = 512;

  private closedSteps: JourneyStep[] = [];

  private openStep: OpenStep | undefined;

  private sessionStartedAtMs: number;

  private partStartedAtMs: number;

  private lastFlushAtMs: number | undefined;

  private flushInFlight = false;

  private journeyPartIndex = 0;

  private journeyId: string;

  // The first split is still part 0, so the index alone cannot identify it.
  private hasSplit = false;

  constructor() {
    this.sessionStartedAtMs = Date.now();
    this.partStartedAtMs = this.sessionStartedAtMs;
    this.journeyId = uuidv4();
  }

  recordStep(pagePattern: string): void {
    if (this.openStep?.pagePattern === pagePattern) {
      return;
    }

    const now = Date.now();

    if (this.openStep) {
      this.closedSteps.push({
        pagePattern: this.openStep.pagePattern,
        durationMs: now - this.openStep.enteredAt,
        toPagePattern: pagePattern,
      });
      // Prevent the boundary step from also appearing as the live step.
      this.openStep = undefined;

      if (this.estimatedPayloadBytes() > MAX_PAYLOAD_BYTES) {
        this.hasSplit = true;
        // Payload protection must not be blocked by lifecycle-flush deduplication.
        if (this.flushAt(now, { force: true })) {
          this.softReset(now);
        }
      }
    }

    this.openStep = {
      pagePattern,
      enteredAt: now,
    };
  }

  flush(options?: { force?: boolean }): boolean {
    return this.flushAt(Date.now(), options);
  }

  /**
   * Like `flush()`, but waits for the Segment SDK dispatch/queue operation to
   * settle. Use this when a synchronous navigation follows immediately (e.g.
   * logout), while retaining the snapshot if the SDK reports failure.
   */
  async flushAndWait(options?: { force?: boolean }): Promise<boolean> {
    const now = Date.now();
    if (!options?.force && !this.canFlush(now)) {
      return false;
    }

    const snapshot = this.buildSnapshot(now);
    if (!snapshot) {
      return false;
    }

    if (this.flushInFlight) {
      return false;
    }

    this.flushInFlight = true;
    try {
      const sent = await analyticsService.trackAndWait(TrackEvents.user_journey_event, snapshot);
      if (sent) {
        this.markFlushed(now);
      }
      return sent;
    } finally {
      this.flushInFlight = false;
    }
  }

  private flushAt(now: number, options?: { force?: boolean }): boolean {
    if (!options?.force && !this.canFlush(now)) {
      return false;
    }

    const snapshot = this.buildSnapshot(now);
    if (!snapshot) {
      return false;
    }

    const sent = analyticsService.track(TrackEvents.user_journey_event, snapshot);
    if (sent) {
      this.markFlushed(now);
    }
    return sent;
  }

  reset(): void {
    const now = Date.now();
    this.closedSteps = [];
    this.openStep = undefined;
    this.sessionStartedAtMs = now;
    this.partStartedAtMs = now;
    this.lastFlushAtMs = undefined;
    this.flushInFlight = false;
    this.journeyId = uuidv4();
    this.journeyPartIndex = 0;
    this.hasSplit = false;
  }

  private softReset(now: number): void {
    this.closedSteps = [];
    this.journeyPartIndex += 1;
    this.partStartedAtMs = now;
  }

  private canFlush(now: number): boolean {
    return (
      this.lastFlushAtMs === undefined ||
      now - this.lastFlushAtMs >= JourneyCollector.FLUSH_DEDUPE_WINDOW_MS
    );
  }

  private markFlushed(now: number): void {
    this.lastFlushAtMs = now;
  }

  private estimatedPayloadBytes(): number {
    return JSON.stringify(this.closedSteps).length + JourneyCollector.PAYLOAD_OVERHEAD_BYTES;
  }

  private buildSnapshot(now: number): JourneySnapshot | undefined {
    const steps: JourneyStep[] = [...this.closedSteps];

    if (this.openStep) {
      steps.push({
        pagePattern: this.openStep.pagePattern,
        durationMs: now - this.openStep.enteredAt,
      });
    }

    const [firstStep, ...remainingSteps] = steps;
    if (!firstStep) {
      return undefined;
    }

    return {
      sessionStartedAt: new Date(this.sessionStartedAtMs).toISOString(),
      totalDurationMs: now - this.partStartedAtMs,
      steps: [firstStep, ...remainingSteps],
      ...(this.hasSplit
        ? { journeyId: this.journeyId, journeyPartIndex: this.journeyPartIndex }
        : {}),
    };
  }
}

export const journeyCollector = new JourneyCollector();
