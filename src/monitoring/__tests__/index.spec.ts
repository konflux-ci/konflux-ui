import { mockConsole, MockConsole } from '~/unit-test-utils';
import type { MonitoringConfig } from '../types';

jest.mock('@sentry/react', () => ({
  init: jest.fn(),
  captureException: jest.fn().mockReturnValue('event-id'),
  captureMessage: jest.fn().mockReturnValue('event-id'),
  setUser: jest.fn(),
  browserTracingIntegration: jest.fn(),
}));

jest.mock('../load-config', () => ({
  loadMonitoringConfig: jest.fn(),
}));

describe('initMonitoring', () => {
  let consoleMock: MockConsole;
  let loadMonitoringConfigMock: jest.Mock;

  beforeEach(() => {
    consoleMock = mockConsole();
    jest.resetModules();
    loadMonitoringConfigMock = jest.requireMock('../load-config').loadMonitoringConfig;
  });

  afterEach(() => {
    consoleMock.restore();
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
    const result = await indexModule.initMonitoring();

    expect(loadMonitoringConfigMock).toHaveBeenCalled();
    expect(createSpy).toHaveBeenCalledWith(mockConfig);
    expect(indexModule.monitoringService).toBe(result);
    expect(result).toBeInstanceOf(MonitoringService);

    createSpy.mockRestore();
  });
});
