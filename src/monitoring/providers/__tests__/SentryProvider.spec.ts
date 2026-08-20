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

jest.mock('~/analytics/obfuscate', () => ({
  obfuscate: jest.fn().mockResolvedValue('hashed-user-id'),
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
        sampleRate: 1.0,
        sendDefaultPii: true,
        tracesSampler: expect.any(Function),
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
        tracesSampler: expect.any(Function),
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

  it('should hash user ID and drop email/username before sending to Sentry', async () => {
    await provider.setUser({ id: '123', username: 'testuser', email: 'test@example.com' });
    expect(Sentry.setUser).toHaveBeenCalledWith({ id: 'hashed-user-id' });
  });

  it('should set Sentry user to null when user is null', async () => {
    await provider.setUser(null);
    expect(Sentry.setUser).toHaveBeenCalledWith(null);
  });

  it('should set Sentry user to null when user has no id', async () => {
    await provider.setUser({ username: 'testuser' });
    expect(Sentry.setUser).toHaveBeenCalledWith(null);
  });

  describe('beforeSend', () => {
    const defaultConfig = {
      enabled: true,
      provider: 'sentry' as const,
      dsn: 'https://test@sentry.io/123',
      environment: 'production',
    };

    it('should pass beforeSend callback to Sentry.init', () => {
      provider.init(defaultConfig);
      const initCall = Sentry.init as jest.Mock;
      const config = initCall.mock.calls[0][0];
      expect(config.beforeSend).toBeDefined();
      expect(typeof config.beforeSend).toBe('function');
    });

    it('should return null for 404 on non-plugin API path', () => {
      provider.init(defaultConfig);
      const initCall = Sentry.init as jest.Mock;
      const { beforeSend } = initCall.mock.calls[0][0];

      const event = {
        request: { url: '/api/k8s/apis/v1/pods/my-pod' },
        // eslint-disable-next-line camelcase
        contexts: { response: { status_code: 404 } },
      };
      expect(beforeSend(event)).toBeNull();
    });

    it('should return event for 404 on plugin path', () => {
      provider.init(defaultConfig);
      const initCall = Sentry.init as jest.Mock;
      const { beforeSend } = initCall.mock.calls[0][0];

      const event = {
        request: { url: '/api/k8s/plugins/kubearchive/apis/v1/pods' },
        // eslint-disable-next-line camelcase
        contexts: { response: { status_code: 404 } },
      };
      expect(beforeSend(event)).toBe(event);
    });

    it('should return event when no request URL exists', () => {
      provider.init(defaultConfig);
      const initCall = Sentry.init as jest.Mock;
      const { beforeSend } = initCall.mock.calls[0][0];

      const event = { exception: { values: [{ type: 'Error', value: 'test' }] } };
      expect(beforeSend(event)).toBe(event);
    });

    it('should use sample rate for partial sampling', () => {
      const configWithRate = {
        ...defaultConfig,
        sampleRates: { errors: 0.5 },
      };
      provider.init(configWithRate);
      const initCall = Sentry.init as jest.Mock;
      const { beforeSend } = initCall.mock.calls[0][0];

      const event = {
        request: { url: '/api/k8s/apis/v1/pods' },
        // eslint-disable-next-line camelcase
        contexts: { response: { status_code: 500 } },
      };

      // With Math.random mocked to return 0.3 (< 0.5), event should be sent
      jest.spyOn(Math, 'random').mockReturnValue(0.3);
      expect(beforeSend(event)).toBe(event);

      // With Math.random mocked to return 0.7 (>= 0.5), event should be dropped
      jest.spyOn(Math, 'random').mockReturnValue(0.7);
      expect(beforeSend(event)).toBeNull();

      jest.restoreAllMocks();
    });

    it('should ignore chrome extension requests', () => {
      provider.init(defaultConfig);
      const initCall = Sentry.init as jest.Mock;
      const { beforeSend } = initCall.mock.calls[0][0];

      const event = {
        request: { url: 'chrome-extension://abc/content.js' },
        // eslint-disable-next-line camelcase
        contexts: { response: { status_code: 500 } },
      };
      expect(beforeSend(event)).toBeNull();
    });
  });

  describe('beforeSendSpan', () => {
    const defaultConfig = {
      enabled: true,
      provider: 'sentry' as const,
      dsn: 'https://test@sentry.io/123',
      environment: 'production',
    };

    it('should pass beforeSendSpan callback to Sentry.init', () => {
      provider.init(defaultConfig);
      const initCall = Sentry.init as jest.Mock;
      const config = initCall.mock.calls[0][0];
      expect(config.beforeSendSpan).toBeDefined();
      expect(typeof config.beforeSendSpan).toBe('function');
    });
  });

  describe('tracesSampler', () => {
    it('should use configured traces sample rate for same-origin transactions', () => {
      const config = {
        enabled: true,
        provider: 'sentry' as const,
        dsn: 'https://test@sentry.io/123',
        environment: 'production',
        sampleRates: { traces: 0.3 },
      };
      provider.init(config);
      const initCall = Sentry.init as jest.Mock;
      const { tracesSampler } = initCall.mock.calls[0][0];

      expect(tracesSampler({ name: '/applications' })).toBe(0.3);
    });

    it('should use default 0.2 rate when traces rate is not configured', () => {
      const config = {
        enabled: true,
        provider: 'sentry' as const,
        dsn: 'https://test@sentry.io/123',
        environment: 'production',
      };
      provider.init(config);
      const initCall = Sentry.init as jest.Mock;
      const { tracesSampler } = initCall.mock.calls[0][0];

      expect(tracesSampler({ name: '/applications' })).toBe(0.2);
    });

    it('should return 0 for non-app transaction names', () => {
      const config = {
        enabled: true,
        provider: 'sentry' as const,
        dsn: 'https://test@sentry.io/123',
        environment: 'production',
        sampleRates: { traces: 0.5 },
      };
      provider.init(config);
      const initCall = Sentry.init as jest.Mock;
      const { tracesSampler } = initCall.mock.calls[0][0];

      expect(tracesSampler({ name: 'chrome-extension://abc/script.js' })).toBe(0);
    });

    it('should sample plugin path transactions at configured rate', () => {
      const config = {
        enabled: true,
        provider: 'sentry' as const,
        dsn: 'https://test@sentry.io/123',
        environment: 'production',
        sampleRates: { traces: 0.3 },
      };
      provider.init(config);
      const initCall = Sentry.init as jest.Mock;
      const { tracesSampler } = initCall.mock.calls[0][0];

      // Plugin paths have sampleRate 1 from rules, so tracesSampler returns the traces rate
      expect(tracesSampler({ name: '/api/k8s/plugins/kubearchive/test' })).toBe(0.3);
    });

    it('should inherit parent sampling decision when parentSampled is defined', () => {
      const config = {
        enabled: true,
        provider: 'sentry' as const,
        dsn: 'https://test@sentry.io/123',
        environment: 'production',
        sampleRates: { traces: 0.3 },
      };
      provider.init(config);
      const initCall = Sentry.init as jest.Mock;
      const { tracesSampler } = initCall.mock.calls[0][0];

      expect(tracesSampler({ name: '/applications', parentSampled: true })).toBe(true);
      expect(tracesSampler({ name: '/applications', parentSampled: false })).toBe(false);
    });
  });
});
