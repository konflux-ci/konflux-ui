import { act, renderHook } from '@testing-library/react';
import { TrackEvents } from '~/analytics';
import { FlagKey } from '../flags';
import { useFeatureFlags } from '../hooks';
import { FeatureFlagsStore } from '../store';
import { computeFeatureFlagChanges, useFeatureFlagAnalytics } from '../useFeatureFlagAnalytics';

jest.mock('~/analytics/hooks', () => ({
  useTrackAnalyticsEvent: jest.fn(),
}));

jest.mock('../flags', () => {
  const actual = jest.requireActual('../flags');
  return {
    ...actual,
    FLAGS: {
      alpha: { key: 'alpha', description: 'Alpha flag', defaultEnabled: false, status: 'wip' },
      beta: { key: 'beta', description: 'Beta flag', defaultEnabled: true, status: 'ready' },
    },
  };
});

const { useTrackAnalyticsEvent }: { useTrackAnalyticsEvent: jest.Mock } =
  jest.requireMock('~/analytics/hooks');

const state = (overrides: Partial<Record<FlagKey, boolean>>) =>
  ({
    'column-management': true,
    'kubearchive-logs': true,
    mintmaker: false,
    ...overrides,
  }) as Record<FlagKey, boolean>;

describe('computeFeatureFlagChanges', () => {
  it('returns an empty changes object and changesCount 0 when nothing changed', () => {
    expect(computeFeatureFlagChanges(state({}), state({}))).toEqual({
      changes: {},
      changesCount: 0,
    });
  });

  it('reports a single flag change with its new value', () => {
    const before = state({ 'kubearchive-logs': true });
    const after = state({ 'kubearchive-logs': false });

    expect(computeFeatureFlagChanges(before, after)).toEqual({
      changes: { 'kubearchive-logs': false },
      changesCount: 1,
    });
  });

  it('reports multiple flag changes, each with its new value', () => {
    const before = state({ 'kubearchive-logs': true, mintmaker: false });
    const after = state({ 'kubearchive-logs': false, mintmaker: true });

    expect(computeFeatureFlagChanges(before, after)).toEqual({
      changes: { 'kubearchive-logs': false, mintmaker: true },
      changesCount: 2,
    });
  });

  it('treats a flag flipped off then back on as unchanged (net-zero)', () => {
    // Only the before/after snapshots matter -- intermediate toggles during a
    // single panel session are never observed by this function.
    const before = state({ 'kubearchive-logs': true });
    const after = state({ 'kubearchive-logs': true });

    expect(computeFeatureFlagChanges(before, after)).toEqual({
      changes: {},
      changesCount: 0,
    });
  });

  it('does not include unrelated unchanged flags in the changes object', () => {
    const before = state({ 'column-management': true, 'kubearchive-logs': true });
    const after = state({ 'column-management': true, 'kubearchive-logs': false });

    const { changes } = computeFeatureFlagChanges(before, after);

    expect(changes).not.toHaveProperty('column-management');
    expect(Object.keys(changes)).toEqual(['kubearchive-logs']);
  });

  it('reports every flag as changed when resetting to defaults changes multiple flags', () => {
    const before = state({ 'kubearchive-logs': false, mintmaker: true });
    const after = state({ 'kubearchive-logs': true, mintmaker: false });

    expect(computeFeatureFlagChanges(before, after)).toEqual({
      changes: { 'kubearchive-logs': true, mintmaker: false },
      changesCount: 2,
    });
  });

  it('handles an empty state without throwing', () => {
    expect(
      computeFeatureFlagChanges({} as Record<FlagKey, boolean>, {} as Record<FlagKey, boolean>),
    ).toEqual({
      changes: {},
      changesCount: 0,
    });
  });

  it('does not report keys present only in `before` (removed flags) as changes', () => {
    const before = { ...state({}), 'legacy-flag': true } as Record<FlagKey, boolean>;
    const after = state({});

    const { changes, changesCount } = computeFeatureFlagChanges(before, after);

    expect(changes).not.toHaveProperty('legacy-flag');
    expect(changesCount).toBe(0);
  });
});

describe('useFeatureFlagAnalytics', () => {
  let trackEventMock: jest.Mock;

  beforeEach(() => {
    trackEventMock = jest.fn();
    useTrackAnalyticsEvent.mockReturnValue(trackEventMock);
    localStorage.clear();
    history.replaceState(null, '', '/');
    FeatureFlagsStore.refresh();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // Mirrors how Panel.tsx wires the hook: `flags` comes from useFeatureFlags(),
  // never read from FeatureFlagsStore.state directly.
  const useOpenPanel = () => {
    const [flags] = useFeatureFlags();
    useFeatureFlagAnalytics(flags);
  };

  // Renders and lets the "confirmed real mount" microtask flush, so unmount()
  // isn't mistaken for StrictMode's fake unmount (see test below).
  const renderOpenPanel = async () => {
    const utils = renderHook(useOpenPanel);
    await act(async () => {
      await Promise.resolve();
    });
    return utils;
  };

  it('does not track anything while mounted (panel still open)', () => {
    renderHook(useOpenPanel);

    expect(trackEventMock).not.toHaveBeenCalled();
  });

  it('tracks changesCount 0 and empty changes when nothing was toggled before unmount', async () => {
    const { unmount } = await renderOpenPanel();

    unmount();

    expect(trackEventMock).toHaveBeenCalledTimes(1);
    expect(trackEventMock).toHaveBeenCalledWith(TrackEvents.feature_flags_changed_event, {
      changes: {},
      changesCount: 0,
      pagePath: '/',
    });
  });

  it('tracks a single flag change with its new value on unmount', async () => {
    const { unmount } = await renderOpenPanel();

    act(() => {
      FeatureFlagsStore.set('alpha' as FlagKey, true);
    });
    unmount();

    expect(trackEventMock).toHaveBeenCalledWith(TrackEvents.feature_flags_changed_event, {
      changes: { alpha: true },
      changesCount: 1,
      pagePath: '/',
    });
  });

  it('tracks multiple flag changes on unmount', async () => {
    const { unmount } = await renderOpenPanel();

    act(() => {
      FeatureFlagsStore.set('alpha' as FlagKey, true);
      FeatureFlagsStore.set('beta' as FlagKey, false);
    });
    unmount();

    expect(trackEventMock).toHaveBeenCalledWith(TrackEvents.feature_flags_changed_event, {
      changes: { alpha: true, beta: false },
      changesCount: 2,
      pagePath: '/',
    });
  });

  it('treats a flag toggled off then back on before unmount as a net-zero change', async () => {
    const { unmount } = await renderOpenPanel();

    act(() => {
      FeatureFlagsStore.set('beta' as FlagKey, false);
      FeatureFlagsStore.set('beta' as FlagKey, true);
    });
    unmount();

    expect(trackEventMock).toHaveBeenCalledWith(TrackEvents.feature_flags_changed_event, {
      changes: {},
      changesCount: 0,
      pagePath: '/',
    });
  });

  it('captures the pathname from when the hook mounted (panel opened)', async () => {
    history.replaceState(null, '', '/ns/my-ns/applications');

    const { unmount } = await renderOpenPanel();
    unmount();

    expect(trackEventMock).toHaveBeenCalledWith(
      TrackEvents.feature_flags_changed_event,
      expect.objectContaining({ pagePath: '/ns/my-ns/applications' }),
    );
  });

  it('captures changes made via resetAll() even though it does not unmount the hook', async () => {
    const { unmount } = await renderOpenPanel();

    act(() => {
      FeatureFlagsStore.set('alpha' as FlagKey, true);
      FeatureFlagsStore.resetAll();
    });
    unmount();

    expect(trackEventMock).toHaveBeenCalledWith(TrackEvents.feature_flags_changed_event, {
      changes: {},
      changesCount: 0,
      pagePath: '/',
    });
  });

  it('fires exactly one event per mount/unmount cycle', async () => {
    const { unmount } = await renderOpenPanel();

    act(() => {
      FeatureFlagsStore.set('alpha' as FlagKey, true);
      FeatureFlagsStore.set('beta' as FlagKey, false);
    });
    unmount();

    expect(trackEventMock).toHaveBeenCalledTimes(1);
  });

  it('fires exactly one event even when useTrackAnalyticsEvent() returns a new function on every render', async () => {
    // Regression test: trackEvent's identity legitimately changes on every
    // render in the real app -- only the real unmount should ever fire.
    const calls: unknown[][] = [];
    useTrackAnalyticsEvent.mockImplementation(
      () =>
        (...args: unknown[]) =>
          calls.push(args),
    );

    const { rerender, unmount } = await renderOpenPanel();

    rerender(); // e.g. an unrelated condition resolving asynchronously
    rerender();

    act(() => {
      FeatureFlagsStore.set('alpha' as FlagKey, true); // notifies -> re-render
    });
    rerender();

    expect(calls).toHaveLength(0); // no fire yet -- panel is still open

    unmount();

    expect(calls).toHaveLength(1);
    expect(calls[0]).toEqual([
      TrackEvents.feature_flags_changed_event,
      { changes: { alpha: true }, changesCount: 1, pagePath: '/' },
    ]);
  });

  it("does not fire from React StrictMode's synchronous dev-only mount/unmount/remount", async () => {
    // StrictMode mounts/unmounts/remounts synchronously in dev; that fake
    // unmount must be ignored -- only the real close should fire.
    const fake = renderHook(useOpenPanel);
    fake.unmount(); // simulates StrictMode's synchronous fake unmount

    expect(trackEventMock).not.toHaveBeenCalled();

    const real = renderHook(useOpenPanel); // simulates the real re-mount
    await act(async () => {
      await Promise.resolve(); // let the deferred "confirmed mount" microtask flush
    });

    real.unmount(); // the real panel close

    expect(trackEventMock).toHaveBeenCalledTimes(1);
    expect(trackEventMock).toHaveBeenCalledWith(TrackEvents.feature_flags_changed_event, {
      changes: {},
      changesCount: 0,
      pagePath: '/',
    });
  });
});
