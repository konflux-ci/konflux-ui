import { mockConsole, MockConsole } from '~/unit-test-utils';
import type { MonitoringConfig } from '../../types';
import { SentryProvider } from '../SentryProvider';

jest.mock('@sentry/react', () => ({
  init: jest.fn(),
  captureException: jest.fn().mockReturnValue('exception-event-id'),
  captureMessage: jest.fn().mockReturnValue('message-event-id'),
  setUser: jest.fn(),
  browserTracingIntegration: jest.fn().mockReturnValue({ name: 'BrowserTracing' }),
}));

describe('SentryProvider', () => {
  let provider: SentryProvider;
  let consoleMock: MockConsole;
  let Sentry: typeof import('@sentry/react');

  beforeEach(() => {
    provider = new SentryProvider();
    consoleMock = mockConsole();
    Sentry = jest.requireMock('@sentry/react');
    jest.clearAllMocks();
  });

  afterEach(() => {
    consoleMock.restore();
  });

  it('should initialize Sentry with merged config and log success', async () => {
    const config: MonitoringConfig & { dsn: string } = {
      enabled: true,
      provider: 'sentry',
      dsn: 'https://test@sentry.io/123',
      environment: 'production',
      cluster: 'prod-cluster',
      sampleRates: { errors: 0.5 },
    };

    await provider.init(config);

    expect(Sentry.init).toHaveBeenCalledWith(
      expect.objectContaining({
        dsn: 'https://test@sentry.io/123',
        environment: 'production',
        sampleRate: 0.5,
        sendDefaultPii: true,
        tracesSampleRate: 0.2,
        initialScope: { tags: { cluster: 'prod-cluster' } },
      }),
    );
    expect(consoleMock.info).toHaveBeenCalledWith('Sentry initialized', expect.any(Object));
  });

  it('should use default values when config fields are missing', async () => {
    const config: MonitoringConfig & { dsn: string } = {
      enabled: true,
      provider: 'sentry',
      dsn: 'https://test@sentry.io/123',
      environment: 'production',
    };

    await provider.init(config);

    expect(Sentry.init).toHaveBeenCalledWith(
      expect.objectContaining({
        sampleRate: 1.0,
        initialScope: { tags: { cluster: 'unknown' } },
      }),
    );
  });

  it('should use default sample rate when sampleRates.errors is undefined', async () => {
    const config: MonitoringConfig & { dsn: string } = {
      enabled: true,
      provider: 'sentry',
      dsn: 'https://test@sentry.io/123',
      environment: 'production',
      sampleRates: {},
    };

    await provider.init(config);

    expect(Sentry.init).toHaveBeenCalledWith(
      expect.objectContaining({
        sampleRate: 1.0,
      }),
    );
  });

  it('should use "unknown" cluster when cluster is empty string', async () => {
    const config: MonitoringConfig & { dsn: string; cluster: string } = {
      enabled: true,
      provider: 'sentry',
      dsn: 'https://test@sentry.io/123',
      environment: 'production',
      cluster: '',
    };

    await provider.init(config);

    expect(Sentry.init).toHaveBeenCalledWith(
      expect.objectContaining({
        initialScope: { tags: { cluster: 'unknown' } },
      }),
    );
  });

  it('should delegate captureException to Sentry and return event ID', () => {
    const error = new Error('test error');
    const context = { userId: '123' };

    const result = provider.captureException(error, context);

    expect(Sentry.captureException).toHaveBeenCalledWith(error, context);
    expect(result).toBe('exception-event-id');
  });

  it('should delegate captureMessage to Sentry with level and return event ID', () => {
    const result = provider.captureMessage('test message', 'warn', { extra: 'data' });

    expect(Sentry.captureMessage).toHaveBeenCalledWith('test message', {
      level: 'warn',
      extra: 'data',
    });
    expect(result).toBe('message-event-id');
  });

  it('should delegate setUser to Sentry', () => {
    provider.setUser({ id: '123', email: 'test@example.com' });
    expect(Sentry.setUser).toHaveBeenCalledWith({ id: '123', email: 'test@example.com' });

    provider.setUser(null);
    expect(Sentry.setUser).toHaveBeenCalledWith(null);
  });
});
