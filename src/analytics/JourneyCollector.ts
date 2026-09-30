import { v4 as uuidv4 } from 'uuid';
import { analyticsService } from './AnalyticsService';
import { CommonFields, JourneyStep, TrackEvents, UserJourneyEvent } from './gen/analytics-types';

/** Maximum estimated payload size before a journey is split into another part. */
export const MAX_PAYLOAD_BYTES = 80 * 1024;

/** Timed checkpoint interval: at most one checkpoint per this period. */
export const CHECKPOINT_INTERVAL_MS = 15 * 60 * 1000;

/** Route inactivity threshold: start a new journey when exceeded. */
export const INACTIVITY_THRESHOLD_MS = 20 * 60 * 1000;

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

  /** Timestamp of the most recent route transition (recordStep with a new pattern). */
  private lastRouteActivityMs: number;

  /** True once at least two distinct route patterns have been recorded in this journey. */
  private hasDistinctTransition = false;

  /** True when route transitions exist that have not yet been successfully checkpointed. */
  private isDirty = false;

  constructor() {
    this.sessionStartedAtMs = Date.now();
    this.partStartedAtMs = this.sessionStartedAtMs;
    this.lastRouteActivityMs = this.sessionStartedAtMs;
    this.journeyId = uuidv4();
  }

  recordStep(pagePattern: string): void {
    if (this.openStep?.pagePattern === pagePattern) {
      return;
    }

    const now = Date.now();

    // Rotate the journey when the tab resumes after prolonged inactivity.
    if (
      this.openStep &&
      now - this.lastRouteActivityMs >= INACTIVITY_THRESHOLD_MS
    ) {
      if (this.hasDistinctTransition && this.isDirty) {
        this.flushAt(now, { force: true });
      }
      this.reset();
    }

    if (this.openStep) {
      this.closedSteps.push({
        pagePattern: this.openStep.pagePattern,
        durationMs: now - this.openStep.enteredAt,
        toPagePattern: pagePattern,
      });
      // Prevent the boundary step from also appearing as the live step.
      this.openStep = undefined;

      this.hasDistinctTransition = true;
      this.isDirty = true;

      if (this.estimatedPayloadBytes() > MAX_PAYLOAD_BYTES) {
        // Payload protection must not be blocked by lifecycle-flush deduplication.
        this.flushAt(now, { force: true });
      }
    }

    this.lastRouteActivityMs = now;
    this.openStep = {
      pagePattern,
      enteredAt: now,
    };
  }

  /**
   * Whether the journey has meaningful data worth checkpointing: at least one
   * distinct route transition has occurred and unsent data exists.
   */
  isEligibleForCheckpoint(): boolean {
    return this.hasDistinctTransition && this.isDirty;
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
    if (this.flushInFlight) {
      return false;
    }

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
    this.lastRouteActivityMs = now;
    this.hasDistinctTransition = false;
    this.isDirty = false;
  }

  private startNextSegment(now: number): void {
    this.closedSteps = [];
    this.journeyPartIndex += 1;
    this.partStartedAtMs = now;
    this.hasDistinctTransition = false;
    this.isDirty = false;

    if (this.openStep) {
      this.openStep = {
        pagePattern: this.openStep.pagePattern,
        enteredAt: now,
      };
    }
  }

  private canFlush(now: number): boolean {
    return (
      this.lastFlushAtMs === undefined ||
      now - this.lastFlushAtMs >= JourneyCollector.FLUSH_DEDUPE_WINDOW_MS
    );
  }

  private markFlushed(now: number): void {
    this.lastFlushAtMs = now;
    this.startNextSegment(now);
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
    if (!firstStep || !this.hasDistinctTransition) {
      return undefined;
    }

    return {
      sessionStartedAt: new Date(this.sessionStartedAtMs).toISOString(),
      totalDurationMs: now - this.partStartedAtMs,
      steps: [firstStep, ...remainingSteps],
      journeyId: this.journeyId,
      journeyPartIndex: this.journeyPartIndex,
    };
  }
}

export const journeyCollector = new JourneyCollector();
