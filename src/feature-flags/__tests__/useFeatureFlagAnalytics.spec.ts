import { act, renderHook } from '@testing-library/react';
import { TrackEvents } from '~/analytics';
import { FlagKey } from '../flags';
import { useFeatureFlags } from '../hooks';
import { FeatureFlagsStore } from '../store';
import { computeFeatureFlagChanges, useFeatureFlagAnalytics } from '../useFeatureFlagAnalytics';

jest.mock('~/analytics/hooks', () => ({
  useTrackAnalyticsEvent: jest.fn(),
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useMatches: jest.fn(),
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
const { useMatches }: { useMatches: jest.Mock } = jest.requireMock('react-router-dom');

/** Mocks useMatches() so the hook resolves `pattern` via getRoutePatternFromMatches. */
const mockPagePattern = (pattern: string) =>
  useMatches.mockReturnValue([{ handle: { routePattern: pattern } }]);

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
    mockPagePattern('/');
    localStorage.clear();
    history.replaceState(null, '', '/');
    FeatureFlagsStore.refresh();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // Mirrors how Panel.tsx wires the hook: `flags` comes from useFeatureFlags(),
  // never read from FeatureFlagsStore.state directly. The hook returns the
  // "close" callback -- the caller decides when to invoke it.
  const useOpenPanel = () => {
    const [flags] = useFeatureFlags();
    return useFeatureFlagAnalytics(flags);
  };

  it('does not track anything while mounted (panel still open)', () => {
    renderHook(useOpenPanel);

    expect(trackEventMock).not.toHaveBeenCalled();
  });

  it('does not track anything on unmount alone -- only calling the returned callback fires', () => {
    const { unmount } = renderHook(useOpenPanel);

    unmount();

    expect(trackEventMock).not.toHaveBeenCalled();
  });

  it('tracks changesCount 0 and empty changes when nothing was toggled before close', () => {
    const { result } = renderHook(useOpenPanel);

    result.current();

    expect(trackEventMock).toHaveBeenCalledTimes(1);
    expect(trackEventMock).toHaveBeenCalledWith(TrackEvents.feature_flags_changed_event, {
      changes: {},
      changesCount: 0,
      pagePattern: '/',
    });
  });

  it('tracks a single flag change with its new value on close', () => {
    const { result } = renderHook(useOpenPanel);

    act(() => {
      FeatureFlagsStore.set('alpha' as FlagKey, true);
    });
    result.current();

    expect(trackEventMock).toHaveBeenCalledWith(TrackEvents.feature_flags_changed_event, {
      changes: { alpha: true },
      changesCount: 1,
      pagePattern: '/',
    });
  });

  it('tracks multiple flag changes on close', () => {
    const { result } = renderHook(useOpenPanel);

    act(() => {
      FeatureFlagsStore.set('alpha' as FlagKey, true);
      FeatureFlagsStore.set('beta' as FlagKey, false);
    });
    result.current();

    expect(trackEventMock).toHaveBeenCalledWith(TrackEvents.feature_flags_changed_event, {
      changes: { alpha: true, beta: false },
      changesCount: 2,
      pagePattern: '/',
    });
  });

  it('treats a flag toggled off then back on before close as a net-zero change', () => {
    const { result } = renderHook(useOpenPanel);

    act(() => {
      FeatureFlagsStore.set('beta' as FlagKey, false);
      FeatureFlagsStore.set('beta' as FlagKey, true);
    });
    result.current();

    expect(trackEventMock).toHaveBeenCalledWith(TrackEvents.feature_flags_changed_event, {
      changes: {},
      changesCount: 0,
      pagePattern: '/',
    });
  });

  it('captures the page pattern from when the hook mounted (panel opened), not when it closed', () => {
    mockPagePattern('/ns/:workspaceName/applications');

    const { result } = renderHook(useOpenPanel);
    mockPagePattern('/ns/:workspaceName/applications/:applicationName');
    result.current();

    expect(trackEventMock).toHaveBeenCalledWith(
      TrackEvents.feature_flags_changed_event,
      expect.objectContaining({ pagePattern: '/ns/:workspaceName/applications' }),
    );
  });

  it('captures changes made via resetAll() even though it does not unmount the hook', () => {
    const { result } = renderHook(useOpenPanel);

    act(() => {
      FeatureFlagsStore.set('alpha' as FlagKey, true);
      FeatureFlagsStore.resetAll();
    });
    result.current();

    expect(trackEventMock).toHaveBeenCalledWith(TrackEvents.feature_flags_changed_event, {
      changes: {},
      changesCount: 0,
      pagePattern: '/',
    });
  });

  it('fires exactly once per close, even if the callback is invoked more than once', () => {
    const { result } = renderHook(useOpenPanel);

    act(() => {
      FeatureFlagsStore.set('alpha' as FlagKey, true);
      FeatureFlagsStore.set('beta' as FlagKey, false);
    });
    result.current();
    result.current();

    expect(trackEventMock).toHaveBeenCalledTimes(1);
  });

  it('fires exactly one event even when useTrackAnalyticsEvent() returns a new function on every render', () => {
    // Regression test: trackEvent's identity legitimately changes on every
    // render in the real app -- only calling the returned callback should fire.
    const calls: unknown[][] = [];
    useTrackAnalyticsEvent.mockImplementation(
      () =>
        (...args: unknown[]) =>
          calls.push(args),
    );

    const { result, rerender } = renderHook(useOpenPanel);

    rerender(); // e.g. an unrelated condition resolving asynchronously
    rerender();

    act(() => {
      FeatureFlagsStore.set('alpha' as FlagKey, true); // notifies -> re-render
    });
    rerender();

    expect(calls).toHaveLength(0); // no fire yet -- panel is still open

    result.current();

    expect(calls).toHaveLength(1);
    expect(calls[0]).toEqual([
      TrackEvents.feature_flags_changed_event,
      { changes: { alpha: true }, changesCount: 1, pagePattern: '/' },
    ]);
  });

  it('each hook instance snapshots its own open state, independent of other instances', () => {
    // e.g. React.StrictMode's dev-only double-invoke, or a `key` change on an
    // ancestor -- each mounted instance manages its own close callback now,
    // there is no shared module state to leak between them.
    const first = renderHook(useOpenPanel);
    first.unmount();

    const second = renderHook(useOpenPanel);

    act(() => {
      FeatureFlagsStore.set('alpha' as FlagKey, true);
    });
    second.result.current();

    expect(trackEventMock).toHaveBeenCalledTimes(1);
    expect(trackEventMock).toHaveBeenCalledWith(TrackEvents.feature_flags_changed_event, {
      changes: { alpha: true },
      changesCount: 1,
      pagePattern: '/',
    });
  });
});
