import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TrackEvents } from '~/analytics';
import { FeatureFlagPanel } from '../Panel';
import { FeatureFlagsStore } from '../store';

// Delta-computation edge cases (multi-flag, net-zero toggles, etc.) are
// covered at the hook level in useFeatureFlagAnalytics.spec.ts. These tests
// only verify that the real Panel UI is wired to that hook correctly.
jest.mock('~/analytics/hooks', () => ({
  useTrackAnalyticsEvent: jest.fn(),
}));

const useTrackAnalyticsEventMock = jest.requireMock('~/analytics/hooks')
  .useTrackAnalyticsEvent as jest.Mock;

jest.mock('../flags', () => {
  const actual = jest.requireActual('../flags');
  return {
    ...actual,
    FLAGS: {
      alpha: {
        key: 'alpha',
        description: 'Alpha flag',
        defaultEnabled: false,
        status: 'wip',
      },
      beta: {
        key: 'beta',
        description: 'Beta flag',
        defaultEnabled: true,
        status: 'ready',
      },
    },
  };
});

const getSwitch = (name: string | RegExp) => screen.getByRole('switch', { name });

// Lets the "confirmed real mount" microtask flush (useFeatureFlagAnalytics.ts)
// so unmount() isn't mistaken for StrictMode's dev-only fake unmount.
const renderOpenPanel = async () => {
  const utils = render(<FeatureFlagPanel />);
  await act(async () => {
    await Promise.resolve();
  });
  return utils;
};

describe('FeatureFlagPanel analytics', () => {
  let trackEventMock: jest.Mock;

  beforeEach(() => {
    trackEventMock = jest.fn();
    useTrackAnalyticsEventMock.mockReturnValue(trackEventMock);
    localStorage.clear();
    history.replaceState(null, '', '/');
    FeatureFlagsStore.refresh();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('does not fire until the panel is closed (unmounted)', () => {
    render(<FeatureFlagPanel />);

    expect(trackEventMock).not.toHaveBeenCalled();
  });

  it('fires the event with changesCount 0 and empty changes when nothing was toggled', async () => {
    const { unmount } = await renderOpenPanel();

    unmount();

    expect(trackEventMock).toHaveBeenCalledTimes(1);
    expect(trackEventMock).toHaveBeenCalledWith(TrackEvents.feature_flags_changed_event, {
      changes: {},
      changesCount: 0,
      pagePath: '/',
    });
  });

  it('reports a flag toggled via the real Switch control, with its new value, on close', async () => {
    const user = userEvent.setup();
    const { unmount } = render(<FeatureFlagPanel />);

    await user.click(getSwitch(/Alpha flag/i));
    unmount();

    expect(trackEventMock).toHaveBeenCalledWith(TrackEvents.feature_flags_changed_event, {
      changes: { alpha: true },
      changesCount: 1,
      pagePath: '/',
    });
  });

  it('uses the pathname captured when the panel opened', async () => {
    history.replaceState(null, '', '/ns/my-ns/applications');

    const { unmount } = await renderOpenPanel();
    unmount();

    expect(trackEventMock).toHaveBeenCalledWith(
      TrackEvents.feature_flags_changed_event,
      expect.objectContaining({ pagePath: '/ns/my-ns/applications' }),
    );
  });

  it('captures changes made via the real "Reset to Defaults" button, which does not close the panel', async () => {
    const user = userEvent.setup();
    const { unmount } = render(<FeatureFlagPanel />);

    await user.click(getSwitch(/Alpha flag/i)); // alpha: false -> true
    await user.click(screen.getByTestId('reset-feature-overrides-button'));
    unmount();

    expect(trackEventMock).toHaveBeenCalledWith(TrackEvents.feature_flags_changed_event, {
      changes: {},
      changesCount: 0,
      pagePath: '/',
    });
  });
});
