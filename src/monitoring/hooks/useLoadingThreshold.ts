import { useEffect, useRef } from 'react';
import { monitoringService } from '~/monitoring';
import type { ThresholdConfig } from '~/monitoring/thresholds';

interface UseLoadingThresholdOptions {
  /** Metric name, e.g. 'pipelineruns.list.loading' */
  name: string;
  /** True when loading state is active */
  isLoading: boolean;
  /** Warn/critical thresholds in milliseconds */
  thresholds: ThresholdConfig;
  /** Additional attributes for metrics and events */
  attributes?: Record<string, string | number | boolean>;
}

export function useLoadingThreshold({
  name,
  isLoading,
  thresholds,
  attributes,
}: UseLoadingThresholdOptions): void {
  const startTimeRef = useRef<number | null>(null);
  const warnTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const criticalTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (isLoading) {
      // Loading started
      startTimeRef.current = performance.now();

      warnTimerRef.current = setTimeout(() => {
        monitoringService?.captureMessage(
          `[performance] ${name} loading exceeded ${thresholds.warn}ms (warn threshold)`,
          'warn',
          { threshold: thresholds.warn, ...attributes },
        );
      }, thresholds.warn);

      criticalTimerRef.current = setTimeout(() => {
        monitoringService?.captureMessage(
          `[performance] ${name} loading exceeded ${thresholds.critical}ms (critical threshold)`,
          'error',
          { threshold: thresholds.critical, ...attributes },
        );
      }, thresholds.critical);
    } else if (startTimeRef.current !== null) {
      // Loading finished — report duration
      const duration = performance.now() - startTimeRef.current;
      startTimeRef.current = null;

      monitoringService?.reportMetric(name, duration, {
        unit: 'millisecond',
        attributes,
      });

      // Clear pending timers
      if (warnTimerRef.current) clearTimeout(warnTimerRef.current);
      if (criticalTimerRef.current) clearTimeout(criticalTimerRef.current);
      warnTimerRef.current = null;
      criticalTimerRef.current = null;
    }

    return () => {
      if (warnTimerRef.current) clearTimeout(warnTimerRef.current);
      if (criticalTimerRef.current) clearTimeout(criticalTimerRef.current);
    };
  }, [isLoading, name, thresholds, attributes]);
}
