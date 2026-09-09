import { mockAnalyticsServiceFn } from '~/unit-test-utils';
import { TrackEvents } from '../gen/analytics-types';
import { JourneyCollector, MAX_PAYLOAD_BYTES } from '../JourneyCollector';

const trackMock = mockAnalyticsServiceFn('track');
const trackAndWaitMock = mockAnalyticsServiceFn('trackAndWait');
const NOW = new Date('2024-01-01T00:00:00.000Z');

describe('JourneyCollector', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(NOW);
    jest.clearAllMocks();
    trackMock.mockReturnValue(true);
    trackAndWaitMock.mockResolvedValue(true);
  });

  afterEach(() => jest.useRealTimers());

  it('reports ordered route-pattern steps with transitions and no legacy fields', () => {
    const collector = new JourneyCollector();
    collector.recordStep('/a');
    jest.advanceTimersByTime(1000);
    collector.recordStep('/b/:id');
    jest.advanceTimersByTime(500);

    expect(collector.flush()).toBe(true);
    expect(trackMock).toHaveBeenCalledWith(
      TrackEvents.user_journey_event,
      expect.objectContaining({
        sessionStartedAt: NOW.toISOString(),
        totalDurationMs: 1500,
        steps: [
          { pagePattern: '/a', durationMs: 1000, toPagePattern: '/b/:id' },
          { pagePattern: '/b/:id', durationMs: 500 },
        ],
      }),
    );
    const properties = trackMock.mock.calls[0][1];
    expect(properties.journeyId).toBeUndefined();
    expect(properties.journeyPartIndex).toBeUndefined();
    expect(properties.steps[0]).not.toHaveProperty('path');
    expect(properties.steps[0]).not.toHaveProperty('title');
  });

  it('does not send an empty journey, including a forced flush', () => {
    const collector = new JourneyCollector();

    expect(collector.flush()).toBe(false);
    expect(collector.flush({ force: true })).toBe(false);
    expect(trackMock).not.toHaveBeenCalled();
  });

  it('keeps checkpoints non-destructive', () => {
    const collector = new JourneyCollector();
    collector.recordStep('/a');
    jest.advanceTimersByTime(2000);
    collector.flush();
    jest.advanceTimersByTime(2000);
    collector.recordStep('/b');
    jest.advanceTimersByTime(1000);
    collector.flush();

    expect(trackMock.mock.calls[1][1].steps).toEqual([
      { pagePattern: '/a', durationMs: 4000, toPagePattern: '/b' },
      { pagePattern: '/b', durationMs: 1000 },
    ]);
  });

  describe('flushAndWait', () => {
    it('resolves once the underlying network send resolves, and reports steps', async () => {
      const collector = new JourneyCollector();
      collector.recordStep('/a');
      jest.advanceTimersByTime(1000);
      collector.recordStep('/b');

      const sent = await collector.flushAndWait({ force: true });

      expect(sent).toBe(true);
      expect(trackAndWaitMock).toHaveBeenCalledWith(
        TrackEvents.user_journey_event,
        expect.objectContaining({
          steps: [
            { pagePattern: '/a', durationMs: 1000, toPagePattern: '/b' },
            { pagePattern: '/b', durationMs: 0 },
          ],
        }),
      );
    });

    it('does not send an empty journey', async () => {
      const collector = new JourneyCollector();

      expect(await collector.flushAndWait()).toBe(false);
      expect(await collector.flushAndWait({ force: true })).toBe(false);
      expect(trackAndWaitMock).not.toHaveBeenCalled();
    });

    it('resolves false when the underlying send fails, without blocking a later retry', async () => {
      trackAndWaitMock.mockResolvedValueOnce(false);
      const collector = new JourneyCollector();
      collector.recordStep('/a');

      expect(await collector.flushAndWait({ force: true })).toBe(false);
      jest.advanceTimersByTime(1000);
      expect(await collector.flushAndWait({ force: true })).toBe(true);
      expect(trackAndWaitMock).toHaveBeenCalledTimes(2);
    });

    it('does not suppress a failed non-forced flush inside the dedupe window', async () => {
      trackAndWaitMock.mockResolvedValueOnce(false).mockResolvedValueOnce(true);
      const collector = new JourneyCollector();
      collector.recordStep('/a');

      await expect(collector.flushAndWait()).resolves.toBe(false);
      await expect(collector.flushAndWait()).resolves.toBe(true);
      expect(trackAndWaitMock).toHaveBeenCalledTimes(2);
    });

    it('does not allow concurrent awaited flushes to duplicate a snapshot', async () => {
      let resolveTrack: (value: boolean) => void = () => {};
      trackAndWaitMock.mockReturnValueOnce(new Promise<boolean>((resolve) => { resolveTrack = resolve; }));
      const collector = new JourneyCollector();
      collector.recordStep('/a');

      const first = collector.flushAndWait();
      await expect(collector.flushAndWait({ force: true })).resolves.toBe(false);
      resolveTrack(true);
      await expect(first).resolves.toBe(true);
      expect(trackAndWaitMock).toHaveBeenCalledTimes(1);
    });

    it('respects checkpoint deduplication unless forced', async () => {
      const collector = new JourneyCollector();
      collector.recordStep('/a');

      expect(await collector.flushAndWait()).toBe(true);
      expect(await collector.flushAndWait()).toBe(false);
      expect(trackAndWaitMock).toHaveBeenCalledTimes(1);
    });
  });

  it('reset clears the journey and starts a new session clock', () => {
    const collector = new JourneyCollector();
    collector.recordStep('/old');
    jest.advanceTimersByTime(1000);
    collector.reset();

    expect(collector.flush()).toBe(false);
    collector.recordStep('/new');
    jest.advanceTimersByTime(300);
    collector.flush();

    const properties = trackMock.mock.calls[0][1];
    expect(properties.sessionStartedAt).toBe(new Date(NOW.getTime() + 1000).toISOString());
    expect(properties.totalDurationMs).toBe(300);
    expect(properties.steps).toEqual([{ pagePattern: '/new', durationMs: 300 }]);
  });

  it('ignores same-pattern records without resetting dwell time', () => {
    const collector = new JourneyCollector();
    collector.recordStep('/a');
    jest.advanceTimersByTime(1000);
    collector.recordStep('/a');
    jest.advanceTimersByTime(2000);
    collector.recordStep('/b');
    collector.flush();

    expect(trackMock.mock.calls[0][1].steps).toEqual([
      { pagePattern: '/a', durationMs: 3000, toPagePattern: '/b' },
      { pagePattern: '/b', durationMs: 0 },
    ]);
  });

  describe('payload splitting', () => {
    const LONG_SUFFIX = 'x'.repeat(2000);
    const MAX_STEPS_TO_SPLIT = Math.ceil(MAX_PAYLOAD_BYTES / LONG_SUFFIX.length) + 10;

    const recordUntilSplit = (collector: JourneyCollector): string => {
      let lastPattern = '';
      for (let i = 0; i < MAX_STEPS_TO_SPLIT && trackMock.mock.calls.length === 0; i++) {
        lastPattern = `/page/${i}/${LONG_SUFFIX}`;
        collector.recordStep(lastPattern);
      }
      expect(trackMock).toHaveBeenCalledTimes(1);
      return lastPattern;
    };

    it('forces non-overlapping parts with stable metadata and independent duration clocks', () => {
      const collector = new JourneyCollector();
      collector.recordStep('/start');
      collector.flush();
      trackMock.mockClear();

      // Size protection must win even inside the checkpoint dedupe window.
      const boundaryPattern = recordUntilSplit(collector);
      const firstPart = trackMock.mock.calls[0][1];
      jest.advanceTimersByTime(5000);
      collector.flush();
      const secondPart = trackMock.mock.calls[1][1];

      expect(firstPart.journeyPartIndex).toBe(0);
      expect(secondPart.journeyPartIndex).toBe(1);
      expect(secondPart.journeyId).toBe(firstPart.journeyId);
      expect(secondPart.sessionStartedAt).toBe(firstPart.sessionStartedAt);
      expect(secondPart.totalDurationMs).toBe(5000);
      expect(firstPart.steps).not.toContainEqual(
        expect.objectContaining({ pagePattern: boundaryPattern }),
      );
      expect(secondPart.steps).toEqual([
        expect.objectContaining({ pagePattern: boundaryPattern, durationMs: 5000 }),
      ]);
      const firstPatterns = new Set(
        (firstPart.steps as { pagePattern: string }[]).map(({ pagePattern }) => pagePattern),
      );
      expect(
        (secondPart.steps as { pagePattern: string }[]).every(
          ({ pagePattern }) => !firstPatterns.has(pagePattern),
        ),
      ).toBe(true);
    });

    it('keeps oversized data when delivery fails and retries on the next record', () => {
      const collector = new JourneyCollector();
      trackMock.mockReturnValueOnce(false).mockReturnValue(true);
      collector.recordStep('/start');

      for (let i = 0; i < MAX_STEPS_TO_SPLIT && trackMock.mock.calls.length === 0; i++) {
        collector.recordStep(`/page/${i}/${LONG_SUFFIX}`);
      }

      expect(trackMock).toHaveBeenCalledTimes(1);
      const failedSteps = (trackMock.mock.calls[0][1].steps as unknown[]).length;
      collector.recordStep('/retry');
      expect(trackMock).toHaveBeenCalledTimes(2);
      expect((trackMock.mock.calls[1][1].steps as unknown[]).length).toBeGreaterThan(failedSteps);
    });
  });

  it('force-flushes the final logout journey before reset', () => {
    const collector = new JourneyCollector();
    collector.recordStep('/a');
    collector.flush();
    jest.advanceTimersByTime(100);
    collector.recordStep('/b');

    expect(collector.flush({ force: true })).toBe(true);
    collector.reset();

    expect(trackMock.mock.calls[1][1].steps).toEqual([
      { pagePattern: '/a', durationMs: 100, toPagePattern: '/b' },
      { pagePattern: '/b', durationMs: 0 },
    ]);
    expect(collector.flush()).toBe(false);
  });

});
