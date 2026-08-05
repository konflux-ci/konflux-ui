import React from 'react';
import {
  createRoutesFromChildren,
  matchRoutes,
  useLocation,
  useNavigationType,
} from 'react-router-dom';
import * as Sentry from '@sentry/react';
import type {
  IMonitoringProvider,
  MetricOptions,
  MonitoringConfig,
  MonitoringSpan,
  LogLevel,
  SpanOptions,
  UserContext,
} from '../types';

interface SentryConfig extends MonitoringConfig {
  dsn: string;
  cluster?: string;
}

const DEFAULTS: SentryConfig = {
  enabled: false,
  environment: 'development',
  cluster: 'unknown',
  sampleRates: {
    errors: 1,
  },
} as SentryConfig;

const toSentryLevel = (level?: LogLevel): Sentry.SeverityLevel => {
  return level as Sentry.SeverityLevel;
};

export class SentryProvider implements IMonitoringProvider<SentryConfig> {
  init(config: SentryConfig): void {
    const mergedConfig = { ...DEFAULTS, ...config };
    Sentry.init({
      dsn: mergedConfig.dsn,
      environment: mergedConfig.environment,
      sendDefaultPii: true,
      integrations: [
        Sentry.reactRouterBrowserTracingIntegration({
          useEffect: React.useEffect,
          useLocation,
          useNavigationType,
          createRoutesFromChildren,
          matchRoutes,
        }),
      ],
      tracesSampleRate: mergedConfig.sampleRates?.traces ?? 0.2,
      sampleRate: mergedConfig.sampleRates?.errors ?? 1.0,
      tracePropagationTargets: ['localhost', /^\/api\/k8s/, /^\/oauth2\//],
      initialScope: {
        tags: {
          cluster: mergedConfig.cluster || 'unknown',
        },
      },
    });
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

  startInactiveSpan(options: SpanOptions): MonitoringSpan | null {
    const span = Sentry.startInactiveSpan({
      name: options.name,
      op: options.op,
      attributes: options.attributes,
    });
    return span ?? null;
  }

  reportMetric(name: string, value: number, options?: MetricOptions): void {
    Sentry.metrics.distribution(name, value, {
      unit: options?.unit,
      attributes: options?.attributes,
    });
  }
}
