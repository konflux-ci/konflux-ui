import type { MonitoringConfig } from '../types';

jest.mock('@sentry/react', () => ({
  init: jest.fn(),
  captureException: jest.fn().mockReturnValue('event-id'),
  captureMessage: jest.fn().mockReturnValue('event-id'),
  setUser: jest.fn(),
  reactRouterBrowserTracingIntegration: jest.fn(),
}));

jest.mock('../load-config', () => ({
  loadMonitoringConfig: jest.fn(),
}));

describe('initMonitoring', () => {
  let loadMonitoringConfigMock: jest.Mock;

  beforeEach(() => {
    jest.resetModules();
    loadMonitoringConfigMock = jest.requireMock('../load-config').loadMonitoringConfig;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should load config, create MonitoringService, and set exported variable', async () => {
    const mockConfig: MonitoringConfig = {
      enabled: false,
      provider: 'noop',
      environment: 'test',
      cluster: 'test-cluster',
    };
    loadMonitoringConfigMock.mockReturnValue(mockConfig);

    const { MonitoringService } = await import('../MonitoringService');
    const createSpy = jest.spyOn(MonitoringService, 'create');

    const indexModule = await import('../index');
    const result = indexModule.initMonitoring();

    expect(loadMonitoringConfigMock).toHaveBeenCalled();
    expect(createSpy).toHaveBeenCalledWith(mockConfig);
    expect(indexModule.monitoringService).toBe(result);
    expect(result).toBeInstanceOf(MonitoringService);

    createSpy.mockRestore();
  });
});
