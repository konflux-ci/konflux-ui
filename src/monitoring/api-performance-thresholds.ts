export const API_SLOW_THRESHOLDS = {
  WARN_MS: 3_000,
  CRITICAL_MS: 8_000,
} as const;

export const PLUGIN_SLOW_THRESHOLDS = {
  WARN_MS: 5_000,
  CRITICAL_MS: 10_000,
} as const;

export interface SlowApiResult {
  level: 'warning' | 'error';
  thresholdMs: number;
}

export const getSlowApiThreshold = (url: string, durationMs: number): SlowApiResult | null => {
  if (!url.startsWith('/')) {
    return null;
  }

  const thresholds = url.includes('/plugins/') ? PLUGIN_SLOW_THRESHOLDS : API_SLOW_THRESHOLDS;

  if (durationMs > thresholds.CRITICAL_MS) {
    return { level: 'error', thresholdMs: thresholds.CRITICAL_MS };
  }

  if (durationMs > thresholds.WARN_MS) {
    return { level: 'warning', thresholdMs: thresholds.WARN_MS };
  }

  return null;
};
