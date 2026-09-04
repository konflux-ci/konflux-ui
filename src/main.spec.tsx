import React from 'react';
import { render, waitFor } from '@testing-library/react';
import { obfuscate } from '~/analytics/obfuscate';
import { useKonfluxPublicInfo } from '~/hooks/useKonfluxPublicInfo';
import { useAuth } from './auth/useAuth';
import { useAuthAnalytics } from './auth/useAuthAnalytics';
import { App } from './main';

jest.mock('./instrument', () => ({}));
jest.mock('react-dom/client', () => ({
  createRoot: () => ({ render: jest.fn() }),
}));
jest.mock('react-router-dom', () => ({ RouterProvider: () => null }));
jest.mock('nuqs/adapters/react-router/v6', () => ({
  NuqsAdapter: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
jest.mock('@tanstack/react-query-devtools', () => ({ ReactQueryDevtools: () => null }));
jest.mock('./auth/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
jest.mock('./shared/theme/ThemeContext', () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
jest.mock('./feature-flags/forceEnableFlagsOnce', () => ({ forceEnableFlagsOnce: jest.fn() }));
jest.mock('./feature-flags/store', () => ({
  FeatureFlagsStore: { ensureConditions: jest.fn() },
}));
jest.mock('./feature-flags/utils', () => ({ getAllConditionsKeysFromFlags: jest.fn() }));
jest.mock('./registers', () => ({ REGISTRATIONS_LOADED: false }));
jest.mock('./routes', () => ({ router: {} }));
jest.mock('~/analytics', () => ({ initAnalytics: jest.fn(() => Promise.resolve()) }));
jest.mock('~/analytics/AnalyticsService', () => ({
  analyticsService: { identify: jest.fn(), setCommonProperties: jest.fn() },
  consumeLoginSignal: jest.fn(),
}));
jest.mock('~/analytics/obfuscate', () => ({ obfuscate: jest.fn() }));
jest.mock('~/hooks/useKonfluxPublicInfo', () => ({ useKonfluxPublicInfo: jest.fn() }));
jest.mock('./auth/useAuth', () => ({ useAuth: jest.fn() }));
jest.mock('./auth/useAuthAnalytics', () => ({ useAuthAnalytics: jest.fn() }));
jest.mock('~/monitoring/logger', () => ({ logger: { error: jest.fn() } }));

const useKonfluxPublicInfoMock = useKonfluxPublicInfo as jest.Mock;
const useAuthMock = useAuth as jest.Mock;
const useAuthAnalyticsMock = useAuthAnalytics as jest.Mock;
const obfuscateMock = obfuscate as jest.Mock;
const {
  analyticsService: { identify: identifyMock, setCommonProperties: setCommonPropertiesMock },
  consumeLoginSignal: consumeLoginSignalMock,
}: {
  analyticsService: { identify: jest.Mock; setCommonProperties: jest.Mock };
  consumeLoginSignal: jest.Mock;
} = jest.requireMock('~/analytics/AnalyticsService');

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

    await waitFor(() =>
      expect(obfuscateMock).toHaveBeenCalledWith('test-user', 'test-cluster'),
    );
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
  ])('does not identify without a %s but still tracks a login signal', async (_, user, clusterId) => {
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
  });

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
});
