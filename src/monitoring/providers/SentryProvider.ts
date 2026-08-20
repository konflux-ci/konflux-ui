import React from 'react';
import {
  createRoutesFromChildren,
  matchRoutes,
  useLocation,
  useNavigationType,
} from 'react-router-dom';
import * as Sentry from '@sentry/react';
import { obfuscate } from '~/analytics/obfuscate';
import { evaluateApiEventRules } from '../api-event-rules';
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
    const tracesSampleRate = mergedConfig.sampleRates?.traces ?? 0.2;

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
      tracesSampler: (samplingContext) => {
        // Inherit parent sampling decision to avoid breaking distributed traces
        if (samplingContext.parentSampled !== undefined) {
          return samplingContext.parentSampled;
        }

        const transactionName = samplingContext.name ?? '';
        const override = evaluateApiEventRules(transactionName, 200);
        // If a rule explicitly sets 0 (e.g., non-app requests), drop the trace
        // Otherwise use the configured traces sample rate
        return override === 0 ? 0 : tracesSampleRate;
      },
      sampleRate: mergedConfig.sampleRates?.errors ?? 1.0,
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

        const override = evaluateApiEventRules(request.url, statusCode);
        // undefined = no override, let Sentry's sampleRate handle it
        if (override === undefined) {
          return event;
        }
        // 0 = discard, >0 = always send (overrides default rate)
        return override > 0 ? event : null;
      },
    });
  }

  captureException(error: unknown, context?: Record<string, unknown>): string {
    return Sentry.captureException(error, context);
  }

  captureMessage(message: string, level?: LogLevel, context?: Record<string, unknown>): string {
    return Sentry.captureMessage(message, { level: toSentryLevel(level), ...context });
  }

  async setUser(user: UserContext | null): Promise<void> {
    if (!user?.id) {
      Sentry.setUser(null);
      return;
    }
    const hashedId = await obfuscate(user.id);
    Sentry.setUser({ id: hashedId });
  }
}
