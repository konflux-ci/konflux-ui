import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TrackEvents } from '~/analytics';
import { createFeatureFlagPanelModal, FeatureFlagPanel } from '../Panel';
import { FeatureFlagsStore } from '../store';
import { trackFeatureFlagPanelClosed } from '../useFeatureFlagAnalytics';

// Delta-computation edge cases (multi-flag, net-zero toggles, etc.) are
// covered at the hook level in useFeatureFlagAnalytics.spec.ts. These tests
// only verify that the real Panel UI is wired to that hook correctly.
jest.mock('~/analytics/hooks', () => ({
  useTrackAnalyticsEvent: jest.fn(),
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useMatches: jest.fn(),
}));

const useTrackAnalyticsEventMock = jest.requireMock('~/analytics/hooks')
  .useTrackAnalyticsEvent as jest.Mock;
const useMatchesMock = jest.requireMock('react-router-dom').useMatches as jest.Mock;

/** Mocks useMatches() so the hook resolves its page pattern via getRoutePatternFromMatches. */
const mockPagePattern = (pattern: string) =>
  useMatchesMock.mockReturnValue([{ handle: { routePattern: pattern } }]);

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

describe('FeatureFlagPanel analytics', () => {
  let trackEventMock: jest.Mock;

  beforeEach(() => {
    trackEventMock = jest.fn();
    useTrackAnalyticsEventMock.mockReturnValue(trackEventMock);
    mockPagePattern('/');
    localStorage.clear();
    history.replaceState(null, '', '/');
    FeatureFlagsStore.refresh();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('does not fire while open, nor on a plain unmount -- only on a real close', () => {
    const { unmount } = render(<FeatureFlagPanel />);
    expect(trackEventMock).not.toHaveBeenCalled();

    unmount();
    expect(trackEventMock).not.toHaveBeenCalled();
  });

  it('fires the event with changesCount 0 and empty changes when nothing was toggled', () => {
    render(<FeatureFlagPanel />);

    trackFeatureFlagPanelClosed();

    expect(trackEventMock).toHaveBeenCalledTimes(1);
    expect(trackEventMock).toHaveBeenCalledWith(TrackEvents.feature_flags_changed_event, {
      changes: {},
      changesCount: 0,
      pagePattern: '/',
    });
  });

  it('reports a flag toggled via the real Switch control, with its new value, on close', async () => {
    const user = userEvent.setup();
    render(<FeatureFlagPanel />);

    await user.click(getSwitch(/Alpha flag/i));
    trackFeatureFlagPanelClosed();

    expect(trackEventMock).toHaveBeenCalledWith(TrackEvents.feature_flags_changed_event, {
      changes: { alpha: true },
      changesCount: 1,
      pagePattern: '/',
    });
  });

  it('uses the page pattern captured when the panel opened', () => {
    mockPagePattern('/ns/:workspaceName/applications');

    render(<FeatureFlagPanel />);
    trackFeatureFlagPanelClosed();

    expect(trackEventMock).toHaveBeenCalledWith(
      TrackEvents.feature_flags_changed_event,
      expect.objectContaining({ pagePattern: '/ns/:workspaceName/applications' }),
    );
  });

  it('captures changes made via the real "Reset to Defaults" button, which does not close the panel', async () => {
    const user = userEvent.setup();
    render(<FeatureFlagPanel />);

    await user.click(getSwitch(/Alpha flag/i)); // alpha: false -> true
    await user.click(screen.getByTestId('reset-feature-overrides-button'));
    trackFeatureFlagPanelClosed();

    expect(trackEventMock).toHaveBeenCalledWith(TrackEvents.feature_flags_changed_event, {
      changes: {},
      changesCount: 0,
      pagePattern: '/',
    });
  });

  it('fires when the modal is really closed (X button) -- proves the launcher is wired, not just the hook', async () => {
    // Full loop: createFeatureFlagPanelModal's static onClose (Panel.tsx) is
    // trackFeatureFlagPanelClosed, invoked by PatternFly's real close button.
    const user = userEvent.setup();
    render(createFeatureFlagPanelModal()(jest.fn()), {
      wrapper: ({ children }) => (
        <div>
          <div id="hacDev-modal-container" />
          {children}
        </div>
      ),
    });

    await user.click(getSwitch(/Alpha flag/i));
    await user.click(screen.getByRole('button', { name: 'Close' }));

    expect(trackEventMock).toHaveBeenCalledTimes(1);
    expect(trackEventMock).toHaveBeenCalledWith(TrackEvents.feature_flags_changed_event, {
      changes: { alpha: true },
      changesCount: 1,
      pagePattern: '/',
    });
  });
});
