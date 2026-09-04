import { v4 as uuidv4 } from 'uuid';
import { analyticsService } from './AnalyticsService';
import { CommonFields, JourneyStep, TrackEvents, UserJourneyEvent } from './gen/analytics-types';

// Leave headroom below Amplitude's ~100KB array-property limit.
export const MAX_PAYLOAD_BYTES = 80 * 1024;

interface OpenStep {
  pagePattern: string;
  enteredAt: number;
  hiddenMs: number;
  hiddenSince?: number;
}

type JourneySnapshot = Omit<UserJourneyEvent, keyof CommonFields>;

export class JourneyCollector {
  private static readonly FLUSH_DEDUPE_WINDOW_MS = 1000;

  private static readonly SEGMENT_TRACK_API_PATH = '/v1/t';

  private static readonly PAYLOAD_OVERHEAD_BYTES = 512;

  private closedSteps: JourneyStep[] = [];

  private openStep: OpenStep | undefined;

  private sessionStartedAtMs: number;

  private partStartedAtMs: number;

  private lastFlushAtMs: number | undefined;

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
    const wasHidden = this.openStep?.hiddenSince !== undefined;

    if (this.openStep) {
      if (this.openStep.hiddenSince !== undefined) {
        this.openStep.hiddenMs += now - this.openStep.hiddenSince;
        this.openStep.hiddenSince = undefined;
      }

      this.closedSteps.push({
        pagePattern: this.openStep.pagePattern,
        durationMs: now - this.openStep.enteredAt,
        toPagePattern: pagePattern,
        ...(this.openStep.hiddenMs > 0 ? { hiddenMs: this.openStep.hiddenMs } : {}),
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
      hiddenMs: 0,
      hiddenSince: wasHidden ? now : undefined,
    };
  }

  flush(options?: { force?: boolean }): boolean {
    return this.flushAt(Date.now(), options);
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

  flushViaBeacon(config: { writeKey: string; apiHost: string }): boolean {
    const now = Date.now();
    if (!this.canFlush(now)) {
      return false;
    }

    const snapshot = this.buildSnapshot(now);
    if (!snapshot) {
      return false;
    }
    const commonProperties = analyticsService.getReadyCommonProperties();
    if (!commonProperties) {
      return false;
    }
    this.markFlushed(now);

    const url = `https://${config.apiHost}${JourneyCollector.SEGMENT_TRACK_API_PATH}`;
    const userId = analyticsService.getUserId();
    const body = JSON.stringify({
      event: TrackEvents.user_journey_event as string,
      writeKey: config.writeKey,
      anonymousId: commonProperties.sessionId,
      ...(userId ? { userId } : {}),
      properties: { ...commonProperties, ...snapshot },
    });

    navigator.sendBeacon(url, new Blob([body], { type: 'application/json' }));
    return true;
  }

  reset(): void {
    const now = Date.now();
    this.closedSteps = [];
    this.openStep = undefined;
    this.sessionStartedAtMs = now;
    this.partStartedAtMs = now;
    this.lastFlushAtMs = undefined;
    this.journeyId = uuidv4();
    this.journeyPartIndex = 0;
    this.hasSplit = false;
  }

  notifyHidden(): void {
    if (this.openStep && this.openStep.hiddenSince === undefined) {
      this.openStep.hiddenSince = Date.now();
    }
  }

  notifyVisible(): void {
    if (this.openStep?.hiddenSince !== undefined) {
      this.openStep.hiddenMs += Date.now() - this.openStep.hiddenSince;
      this.openStep.hiddenSince = undefined;
    }
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
      let currentHiddenMs = this.openStep.hiddenMs;
      if (this.openStep.hiddenSince !== undefined) {
        currentHiddenMs += now - this.openStep.hiddenSince;
      }
      steps.push({
        pagePattern: this.openStep.pagePattern,
        durationMs: now - this.openStep.enteredAt,
        ...(currentHiddenMs > 0 ? { hiddenMs: currentHiddenMs } : {}),
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
