import type { MonitoringConfig } from '../../types';
import { SentryProvider } from '../SentryProvider';

jest.mock('@sentry/react', () => ({
  init: jest.fn(),
  captureException: jest.fn().mockReturnValue('exception-event-id'),
  captureMessage: jest.fn().mockReturnValue('message-event-id'),
  setUser: jest.fn(),
  reactRouterBrowserTracingIntegration: jest
    .fn()
    .mockReturnValue({ name: 'ReactRouterBrowserTracing' }),
}));

describe('SentryProvider', () => {
  let provider: SentryProvider;
  let Sentry: typeof import('@sentry/react');

  beforeEach(() => {
    provider = new SentryProvider();
    Sentry = jest.requireMock('@sentry/react');
    jest.clearAllMocks();
  });

  it('should initialize Sentry with React Router browser tracing integration', () => {
    const config: MonitoringConfig & { dsn: string } = {
      enabled: true,
      provider: 'sentry',
      dsn: 'https://test@sentry.io/123',
      environment: 'production',
      cluster: 'prod-cluster',
      sampleRates: { errors: 0.5, traces: 0.3 },
    };

    provider.init(config);

    expect(Sentry.reactRouterBrowserTracingIntegration).toHaveBeenCalledWith(
      expect.objectContaining({
        useEffect: expect.any(Function),
        useLocation: expect.any(Function),
        useNavigationType: expect.any(Function),
        createRoutesFromChildren: expect.any(Function),
        matchRoutes: expect.any(Function),
      }),
    );
    expect(Sentry.init).toHaveBeenCalledWith(
      expect.objectContaining({
        dsn: 'https://test@sentry.io/123',
        environment: 'production',
        sampleRate: 0.5,
        sendDefaultPii: true,
        tracesSampleRate: 0.3,
        tracePropagationTargets: ['localhost', /^\/api\/k8s/, /^\/oauth2\//],
        initialScope: { tags: { cluster: 'prod-cluster' } },
      }),
    );
  });

  it('should restrict tracePropagationTargets to API and auth path prefixes', () => {
    const config: MonitoringConfig & { dsn: string } = {
      enabled: true,
      provider: 'sentry',
      dsn: 'https://test@sentry.io/123',
      environment: 'production',
    };

    provider.init(config);

    const initCall = (Sentry.init as jest.Mock).mock.calls[0][0];
    const targets: (string | RegExp)[] = initCall.tracePropagationTargets;
    const matchesAny = (path: string) =>
      targets.some((t) => (typeof t === 'string' ? path.includes(t) : t.test(path)));

    // Known API paths should match
    expect(matchesAny('/api/k8s/apis/v1/namespaces')).toBe(true);
    expect(matchesAny('/api/k8s/plugins/tekton-results/apis')).toBe(true);
    expect(matchesAny('/oauth2/userinfo')).toBe(true);

    // Arbitrary same-origin paths should NOT match
    expect(matchesAny('/some-random-path')).toBe(false);
    expect(matchesAny('/assets/main.js')).toBe(false);
  });

  it('should use default values when config fields are missing', () => {
    const config: MonitoringConfig & { dsn: string } = {
      enabled: true,
      provider: 'sentry',
      dsn: 'https://test@sentry.io/123',
      environment: 'production',
    };

    provider.init(config);

    expect(Sentry.init).toHaveBeenCalledWith(
      expect.objectContaining({
        sampleRate: 1.0,
        tracesSampleRate: 0.2,
        initialScope: { tags: { cluster: 'unknown' } },
      }),
    );
  });

  it('should use default sample rate when sampleRates.errors is undefined', () => {
    const config: MonitoringConfig & { dsn: string } = {
      enabled: true,
      provider: 'sentry',
      dsn: 'https://test@sentry.io/123',
      environment: 'production',
      sampleRates: {},
    };

    provider.init(config);

    expect(Sentry.init).toHaveBeenCalledWith(
      expect.objectContaining({
        sampleRate: 1.0,
      }),
    );
  });

  it('should use "unknown" cluster when cluster is empty string', () => {
    const config: MonitoringConfig & { dsn: string; cluster: string } = {
      enabled: true,
      provider: 'sentry',
      dsn: 'https://test@sentry.io/123',
      environment: 'production',
      cluster: '',
    };

    provider.init(config);

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
