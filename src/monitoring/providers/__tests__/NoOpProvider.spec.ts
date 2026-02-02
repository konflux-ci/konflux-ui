import { mockConsole, MockConsole } from '~/unit-test-utils';
import type { MonitoringConfig } from '../../types';
import { NoOpProvider } from '../NoOpProvider';

describe('NoOpProvider', () => {
  let provider: NoOpProvider;
  let consoleMock: MockConsole;

  beforeEach(() => {
    provider = new NoOpProvider();
    consoleMock = mockConsole();
  });

  afterEach(() => {
    consoleMock.restore();
  });

  it('should resolve init without error or logging', async () => {
    const config: MonitoringConfig = {
      enabled: false,
      provider: 'noop',
      environment: 'development',
    };

    await expect(provider.init(config)).resolves.toBeUndefined();
    expect(consoleMock.info).not.toHaveBeenCalled();
  });

  it('should log captureException to console.error', () => {
    const error = new Error('test error');
    const context = { userId: '123' };

    provider.captureException(error, context);

    expect(consoleMock.error).toHaveBeenCalledWith('captureException', error, context);
  });

  it('should log captureMessage to appropriate console level', () => {
    provider.captureMessage('info msg', 'info', { extra: 'data' });
    expect(consoleMock.info).toHaveBeenCalledWith('captureMessage', 'info msg', 'info', {
      extra: 'data',
    });

    provider.captureMessage('warn msg', 'warn');
    expect(consoleMock.warn).toHaveBeenCalledWith('captureMessage', 'warn msg', 'warn', undefined);

    provider.captureMessage('default msg');
    expect(consoleMock.info).toHaveBeenCalledWith(
      'captureMessage',
      'default msg',
      undefined,
      undefined,
    );
  });

  it('should log setUser to console.info', () => {
    provider.setUser({ id: '123', username: 'testuser' });
    expect(consoleMock.info).toHaveBeenCalledWith('setUser', { id: '123', username: 'testuser' });

    provider.setUser(null);
    expect(consoleMock.info).toHaveBeenCalledWith('setUser', null);
  });
});
