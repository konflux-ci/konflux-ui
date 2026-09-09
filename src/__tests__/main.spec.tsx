import React from 'react';
import { render, waitFor } from '@testing-library/react';
import { TrackEvents } from '~/analytics';
import { obfuscate } from '~/analytics/obfuscate';
import { useAuth } from '~/auth/useAuth';
import { useAuthAnalytics } from '~/auth/useAuthAnalytics';
import { useKonfluxPublicInfo } from '~/hooks/useKonfluxPublicInfo';
import { App } from '~/main';

jest.mock('~/instrument', () => ({}));
jest.mock('react-dom/client', () => ({
  createRoot: () => ({ render: jest.fn() }),
}));
jest.mock('react-router-dom', () => ({ RouterProvider: () => null }));
jest.mock('nuqs/adapters/react-router/v6', () => ({
  NuqsAdapter: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
jest.mock('@tanstack/react-query-devtools', () => ({ ReactQueryDevtools: () => null }));
jest.mock('~/auth/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
jest.mock('~/shared/theme/ThemeContext', () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
jest.mock('~/feature-flags/forceEnableFlagsOnce', () => ({ forceEnableFlagsOnce: jest.fn() }));
jest.mock('~/feature-flags/store', () => ({
  FeatureFlagsStore: { ensureConditions: jest.fn() },
}));
jest.mock('~/feature-flags/utils', () => ({ getAllConditionsKeysFromFlags: jest.fn() }));
jest.mock('~/registers', () => ({ REGISTRATIONS_LOADED: false }));
jest.mock('~/routes', () => ({ router: {} }));
jest.mock('~/analytics/arrival-source', () => ({
  captureArrivalSourceOnce: jest.fn(),
  hasSessionStarted: jest.fn().mockReturnValue(false),
  markSessionStartedOnce: jest.fn().mockReturnValue(false),
  getArrivalSource: jest.fn().mockReturnValue('direct'),
}));
jest.mock('~/analytics', () => {
  const analyticsTypes = jest.requireActual<typeof import('~/analytics/gen/analytics-types')>(
    '~/analytics/gen/analytics-types',
  );
  return {
    initAnalytics: jest.fn(() => Promise.resolve()),
    TrackEvents: analyticsTypes.TrackEvents,
  };
});
jest.mock('~/analytics/AnalyticsService', () => ({
  analyticsService: { identify: jest.fn(), setCommonProperties: jest.fn(), track: jest.fn() },
  consumeLoginSignal: jest.fn(),
}));
jest.mock('~/analytics/obfuscate', () => ({ obfuscate: jest.fn() }));
jest.mock('~/hooks/useKonfluxPublicInfo', () => ({ useKonfluxPublicInfo: jest.fn() }));
jest.mock('~/auth/useAuth', () => ({ useAuth: jest.fn() }));
jest.mock('~/auth/useAuthAnalytics', () => ({ useAuthAnalytics: jest.fn() }));
jest.mock('~/monitoring/logger', () => ({
  logger: { error: jest.fn(), info: jest.fn() },
}));

const useKonfluxPublicInfoMock = useKonfluxPublicInfo as jest.Mock;
const useAuthMock = useAuth as jest.Mock;
const useAuthAnalyticsMock = useAuthAnalytics as jest.Mock;
const obfuscateMock = obfuscate as jest.Mock;
const {
  analyticsService: {
    identify: identifyMock,
    setCommonProperties: setCommonPropertiesMock,
    track: trackMock,
  },
  consumeLoginSignal: consumeLoginSignalMock,
}: {
  analyticsService: { identify: jest.Mock; setCommonProperties: jest.Mock; track: jest.Mock };
  consumeLoginSignal: jest.Mock;
} = jest.requireMock('~/analytics/AnalyticsService');
const {
  hasSessionStarted: hasSessionStartedMock,
  markSessionStartedOnce: markSessionStartedOnceMock,
} = jest.requireMock('~/analytics/arrival-source');
const { logger }: { logger: { error: jest.Mock; info: jest.Mock } } =
  jest.requireMock('~/monitoring/logger');

describe('App analytics initialization', () => {
  const onLogin = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    useAuthAnalyticsMock.mockReturnValue({ onLogin });
    useAuthMock.mockReturnValue({
      isAuthenticated: true,
      user: { preferredUsername: 'test-user' },
    });
    obfuscateMock.mockResolvedValue('obfuscated-user-id');
  });

  it('does not consume the login signal when public info failed to load', () => {
    useKonfluxPublicInfoMock.mockReturnValue([{}, true, new Error('failed')]);

    render(<App />);

    expect(setCommonPropertiesMock).not.toHaveBeenCalled();
    expect(consumeLoginSignalMock).not.toHaveBeenCalled();
    expect(onLogin).not.toHaveBeenCalled();
  });

  it('falls back clusterVersion to openshiftVersion when clusterVersion is absent', async () => {
    useKonfluxPublicInfoMock.mockReturnValue([
      {
        clusterId: 'test-cluster',
        konfluxVersion: '1.0',
        kubernetesVersion: '1.33',
        openshiftVersion: '4.20',
      },
      true,
      undefined,
    ]);
    consumeLoginSignalMock.mockReturnValue(false);

    render(<App />);

    await waitFor(() =>
      expect(setCommonPropertiesMock).toHaveBeenCalledWith(
        expect.objectContaining({ clusterVersion: '4.20' }),
      ),
    );
  });

  it('identifies an authenticated reload without a login signal', async () => {
    useKonfluxPublicInfoMock.mockReturnValue([
      {
        clusterId: 'test-cluster',
        clusterVersion: '4.20',
        konfluxVersion: '1.0',
        kubernetesVersion: '1.33',
      },
      true,
      undefined,
    ]);
    consumeLoginSignalMock.mockReturnValue(false);

    render(<App />);

    await waitFor(() => expect(obfuscateMock).toHaveBeenCalledWith('test-user', 'test-cluster'));
    expect(identifyMock).toHaveBeenCalledWith('obfuscated-user-id');
    expect(onLogin).not.toHaveBeenCalled();
  });

  it('identifies before consuming and tracking a login signal', async () => {
    useKonfluxPublicInfoMock.mockReturnValue([
      {
        clusterId: 'test-cluster',
        clusterVersion: '4.20',
        konfluxVersion: '1.0',
        kubernetesVersion: '1.33',
        openshiftVersion: '4.20',
      },
      true,
      undefined,
    ]);
    consumeLoginSignalMock.mockReturnValue(true);

    render(<App />);

    await waitFor(() => expect(onLogin).toHaveBeenCalledTimes(1));
    expect(setCommonPropertiesMock).toHaveBeenCalledWith({
      clusterVersion: '4.20',
      konfluxVersion: '1.0',
      kubernetesVersion: '1.33',
      openshiftVersion: '4.20',
    });
    expect(identifyMock.mock.invocationCallOrder[0]).toBeLessThan(
      consumeLoginSignalMock.mock.invocationCallOrder[0],
    );
  });

  it.each([
    ['username', { preferredUsername: null }, 'test-cluster'],
    ['cluster ID', { preferredUsername: 'test-user' }, undefined],
  ])(
    'does not identify without a %s but still tracks a login signal',
    async (_, user, clusterId) => {
      useAuthMock.mockReturnValue({ isAuthenticated: true, user });
      useKonfluxPublicInfoMock.mockReturnValue([
        {
          clusterId,
          clusterVersion: '4.20',
          konfluxVersion: '1.0',
          kubernetesVersion: '1.33',
        },
        true,
        undefined,
      ]);
      consumeLoginSignalMock.mockReturnValue(true);

      render(<App />);

      await waitFor(() => expect(onLogin).toHaveBeenCalledTimes(1));
      expect(obfuscateMock).not.toHaveBeenCalled();
      expect(identifyMock).not.toHaveBeenCalled();
    },
  );

  it('processes the login signal when obfuscation fails', async () => {
    useKonfluxPublicInfoMock.mockReturnValue([
      {
        clusterId: 'test-cluster',
        clusterVersion: '4.20',
        konfluxVersion: '1.0',
        kubernetesVersion: '1.33',
      },
      true,
      undefined,
    ]);
    obfuscateMock.mockRejectedValue(new Error('hash failed'));
    consumeLoginSignalMock.mockReturnValue(true);

    render(<App />);

    await waitFor(() => expect(onLogin).toHaveBeenCalledTimes(1));
    expect(identifyMock).not.toHaveBeenCalled();
  });

  it('does not consume or log the session start when tracking is unavailable', async () => {
    useKonfluxPublicInfoMock.mockReturnValue([
      {
        clusterId: 'test-cluster',
        clusterVersion: '4.20',
        konfluxVersion: '1.0',
        kubernetesVersion: '1.33',
      },
      true,
      undefined,
    ]);
    consumeLoginSignalMock.mockReturnValue(false);
    trackMock.mockReturnValue(false);

    render(<App />);

    await waitFor(() =>
      expect(trackMock).toHaveBeenCalledWith(TrackEvents.ui_session_started_event, {
        arrivalSource: 'direct',
      }),
    );
    expect(hasSessionStartedMock).toHaveBeenCalled();
    expect(markSessionStartedOnceMock).not.toHaveBeenCalled();
    expect(logger.info).not.toHaveBeenCalledWith('UI session started', expect.anything());
  });

  it('consumes and logs the session start after tracking succeeds', async () => {
    useKonfluxPublicInfoMock.mockReturnValue([
      {
        clusterId: 'test-cluster',
        clusterVersion: '4.20',
        konfluxVersion: '1.0',
        kubernetesVersion: '1.33',
      },
      true,
      undefined,
    ]);
    consumeLoginSignalMock.mockReturnValue(false);
    trackMock.mockReturnValue(true);
    markSessionStartedOnceMock.mockReturnValue(true);

    render(<App />);

    await waitFor(() => expect(markSessionStartedOnceMock).toHaveBeenCalledTimes(1));
    expect(logger.info).toHaveBeenCalledWith('UI session started', {
      event: TrackEvents.ui_session_started_event,
      arrivalSource: 'direct',
    });
  });
});
