import { mockConsole, MockConsole } from '~/unit-test-utils';
import { MonitoringService } from '../MonitoringService';
import type { MonitoringConfig } from '../types';

jest.mock('@sentry/react', () => ({
  init: jest.fn(),
  captureException: jest.fn().mockReturnValue('event-id'),
  captureMessage: jest.fn().mockReturnValue('event-id'),
  setUser: jest.fn(),
  browserTracingIntegration: jest.fn(),
}));

describe('MonitoringService', () => {
  let consoleMock: MockConsole;

  beforeEach(() => {
    consoleMock = mockConsole();
  });

  afterEach(() => {
    consoleMock.restore();
    jest.clearAllMocks();
  });

  it('should initialize with NoOpProvider for noop config', async () => {
    const config: MonitoringConfig = {
      enabled: false,
      provider: 'noop',
      environment: 'development',
    };

    const service = new MonitoringService();
    await service.initialize(config);

    service.captureException(new Error('test'));
    expect(consoleMock.error).toHaveBeenCalled();
  });

  it('should initialize with SentryProvider for sentry config', async () => {
    const Sentry = jest.requireMock('@sentry/react');
    const config: MonitoringConfig = {
      enabled: true,
      provider: 'sentry',
      environment: 'production',
      dsn: 'https://test@sentry.io/123',
    };

    const service = new MonitoringService();
    await service.initialize(config);

    expect(Sentry.init).toHaveBeenCalled();
  });

  it('should delegate captureException to provider and return this for chaining', async () => {
    const config: MonitoringConfig = {
      enabled: false,
      provider: 'noop',
      environment: 'development',
    };

    const service = new MonitoringService();
    await service.initialize(config);

    const result = service.captureException(new Error('test'), { key: 'value' });

    expect(consoleMock.error).toHaveBeenCalledWith(
      'captureException',
      expect.any(Error),
      { key: 'value' },
    );
    expect(result).toBe(service);
  });

  it('should delegate captureMessage to provider and return this for chaining', async () => {
    const config: MonitoringConfig = {
      enabled: false,
      provider: 'noop',
      environment: 'development',
    };

    const service = new MonitoringService();
    await service.initialize(config);

    const result = service.captureMessage('test message', 'warn', { extra: 'data' });

    expect(consoleMock.warn).toHaveBeenCalled();
    expect(result).toBe(service);
  });

  it('should delegate setUser to provider and return this for chaining', async () => {
    const config: MonitoringConfig = {
      enabled: false,
      provider: 'noop',
      environment: 'development',
    };

    const service = new MonitoringService();
    await service.initialize(config);

    const result = service.setUser({ id: '123', username: 'testuser' });

    expect(consoleMock.info).toHaveBeenCalledWith('setUser', { id: '123', username: 'testuser' });
    expect(result).toBe(service);
  });

  it('should create and initialize service via static create method', () => {
    const config: MonitoringConfig = {
      enabled: false,
      provider: 'noop',
      environment: 'development',
    };

    const initializeSpy = jest.spyOn(MonitoringService.prototype, 'initialize');
    const service = MonitoringService.create(config);

    expect(service).toBeInstanceOf(MonitoringService);
    expect(initializeSpy).toHaveBeenCalledWith(config);

    initializeSpy.mockRestore();
  });
});
