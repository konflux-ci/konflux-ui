import type {
  IMonitoringProvider,
  LogLevel,
  MetricOptions,
  MonitoringConfig,
  MonitoringSpan,
  SpanOptions,
  UserContext,
} from '../types';

export class NoOpProvider implements IMonitoringProvider<MonitoringConfig> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  init(_: MonitoringConfig): void {
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

  startInactiveSpan(options: SpanOptions): MonitoringSpan {
    const startTime = performance.now();
    const attrs: Record<string, string | number | boolean> = { ...options.attributes };
    return {
      end: () => {
        const duration = performance.now() - startTime;
        // eslint-disable-next-line no-console
        console.debug('[noop-span]', options.name, `${duration.toFixed(1)}ms`, attrs);
      },
      setAttribute: (key: string, value: string | number | boolean) => {
        attrs[key] = value;
      },
    };
  }

  reportMetric(name: string, value: number, options?: MetricOptions): void {
    // eslint-disable-next-line no-console
    console.debug('[noop-metric]', name, value, options?.unit, options?.attributes);
  }
}
