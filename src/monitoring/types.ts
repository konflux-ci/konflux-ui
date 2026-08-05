import type { LogLevel } from '~/consts/log-levels';
export type { LogLevel } from '~/consts/log-levels';

/** Monitoring provider ID */
export type MonitoringProviderId = 'sentry' | 'noop';

/** Monitoring provider configuration */
export interface MonitoringConfig {
  enabled: boolean;
  provider: MonitoringProviderId;
  dsn?: string;
  environment: string;
  cluster?: string;
  sampleRates?: {
    errors?: number; // error capture sample rate (0..1)
    traces?: number; // trace sample rate (0..1)
  };
}

/** User context to associate events and traces with a user. */
export interface UserContext {
  id?: string;
  username?: string;
  email?: string;
  ipAddress?: string;
  [key: string]: unknown;
}

/** Options for starting a span */
export interface SpanOptions {
  name: string;
  op: string;
  attributes?: Record<string, string | number | boolean>;
}

/** Options for reporting a metric */
export interface MetricOptions {
  unit?: string;
  attributes?: Record<string, string | number | boolean>;
}

/** Minimal span interface returned by monitoring providers */
export interface MonitoringSpan {
  end(): void;
  setAttribute(key: string, value: string | number | boolean): void;
}

export interface IMonitoringProvider<TConfig extends MonitoringConfig> {
  /** Initialize the monitoring provider with the given configuration. */
  init(config: TConfig): void;

  /** Capture an exception with optional structured context. */
  captureException(error: unknown, context?: Record<string, unknown>): void;

  /** Capture a log message with optional severity and context. */
  captureMessage(message: string, level?: LogLevel, context?: Record<string, unknown>): void;

  /** Associate user context with future events. */
  setUser(user: UserContext | null): void;

  /** Start an inactive span for timing operations. Returns null if tracing is unavailable. */
  startInactiveSpan(options: SpanOptions): MonitoringSpan | null;

  /** Report a metric value (distribution). */
  reportMetric(name: string, value: number, options?: MetricOptions): void;
}
