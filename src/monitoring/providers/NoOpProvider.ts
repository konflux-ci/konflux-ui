import type { IMonitoringProvider, LogLevel, MonitoringConfig, UserContext } from '../types';

export class NoOpProvider implements IMonitoringProvider<MonitoringConfig> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async init(_: MonitoringConfig): Promise<void> {
    // Intentionally no-op
  }

  captureException(error: unknown, context?: Record<string, unknown>): void {
    // eslint-disable-next-line no-console
    console.error('captureException', error, context);
    // Intentionally no-op
  }

  captureMessage(message: string, level?: LogLevel, context?: Record<string, unknown>): void {
    // eslint-disable-next-line no-console
    (console[level ?? 'info'] ?? console.info)('captureMessage', message, level, context);
    // Intentionally no-op
  }

  setUser(user: UserContext | null): void {
    // eslint-disable-next-line no-console
    console.info('setUser', user);
    // Intentionally no-op
  }
}
