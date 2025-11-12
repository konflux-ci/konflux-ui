import * as Sentry from '@sentry/react';
import type { IMonitoringProvider, MonitoringConfig, LogLevel, UserContext } from '../types';

interface SentryConfig extends MonitoringConfig {
  dsn: string;
}

const DEFAULTS: SentryConfig = {
  enabled: false,
  environment: 'development',
  sampleRates: {
    errors: 1,
  },
} as SentryConfig;

const toSentryLevel = (level?: LogLevel): Sentry.SeverityLevel => {
  return level as Sentry.SeverityLevel;
};

export class SentryProvider implements IMonitoringProvider<SentryConfig> {
  init(config: SentryConfig): Promise<void> {
    const mergedConfig = { ...DEFAULTS, ...config };
    Sentry.init({
      dsn: mergedConfig.dsn,
      sendDefaultPii: true,
      integrations: [Sentry.browserTracingIntegration()],
      tracesSampleRate: 0.2,
      // Set `tracePropagationTargets` to control for which URLs trace propagation should be enabled
      tracePropagationTargets: ['localhost'],
    });
    // eslint-disable-next-line no-console
    console.info('Sentry initialized', mergedConfig);
    return Promise.resolve();
  }

  captureException(error: unknown, context?: Record<string, unknown>): string {
    return Sentry.captureException(error, context);
  }

  captureMessage(message: string, level?: LogLevel, context?: Record<string, unknown>): string {
    return Sentry.captureMessage(message, { level: toSentryLevel(level), ...context });
  }

  setUser(user: UserContext | null): void {
    Sentry.setUser(user);
  }
}
