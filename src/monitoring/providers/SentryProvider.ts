import React from 'react';
import {
  createRoutesFromChildren,
  matchRoutes,
  useLocation,
  useNavigationType,
} from 'react-router-dom';
import * as Sentry from '@sentry/react';
import { createDefaultApiEventRules, evaluateApiEventRules } from '../api-event-rules';
import { getSlowApiThreshold } from '../api-performance-thresholds';
import type { IMonitoringProvider, MonitoringConfig, LogLevel, UserContext } from '../types';

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
    const errorSampleRate = mergedConfig.sampleRates?.errors ?? 1.0;
    const apiEventRules = createDefaultApiEventRules(errorSampleRate);

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
      // Set to 1 — per-event sampling is handled by beforeSend via api event rules
      sampleRate: 1.0,
      tracePropagationTargets: ['localhost', /^\/api\/k8s/, /^\/oauth2\//],
      initialScope: {
        tags: {
          cluster: mergedConfig.cluster || 'unknown',
        },
      },
      beforeSend(event) {
        const request = event.request;
        if (!request?.url) {
          return event;
        }

        const statusCode = event.contexts?.response?.status_code;
        if (typeof statusCode !== 'number') {
          return event;
        }

        const sampleRate = evaluateApiEventRules(request.url, statusCode, apiEventRules);
        if (sampleRate === 0) {
          return null;
        }
        if (sampleRate >= 1) {
          return event;
        }
        return Math.random() < sampleRate ? event : null;
      },
      beforeSendSpan(span) {
        const spanData = span.data;
        if (spanData?.['sentry.op'] !== 'http.client') {
          return span;
        }

        const url = spanData.url as string | undefined;
        const startTimestamp = span.start_timestamp;
        const endTimestamp = span.timestamp;

        if (!url || !startTimestamp || !endTimestamp) {
          return span;
        }

        const durationMs = (endTimestamp - startTimestamp) * 1000;
        const slowResult = getSlowApiThreshold(url, durationMs);

        if (slowResult) {
          Sentry.captureMessage(`Slow API call: ${url}`, {
            level: slowResult.level,
            extra: {
              url,
              durationMs: Math.round(durationMs),
              thresholdMs: slowResult.thresholdMs,
              statusCode: spanData['http.response.status_code'],
            },
            tags: {
              slowApiLevel: slowResult.level,
            },
          });
        }

        return span;
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
}
