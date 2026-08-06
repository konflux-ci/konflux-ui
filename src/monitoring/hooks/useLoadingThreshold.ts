import { useEffect, useRef } from 'react';
import { monitoringService } from '~/monitoring';
import type { ThresholdConfig } from '~/monitoring/thresholds';
import type { MonitoringSpan } from '~/monitoring/types';

interface UseLoadingThresholdOptions {
  /** Span/event name, e.g. 'pipelineruns.list.loading' */
  name: string;
  /** True when loading state is active */
  isLoading: boolean;
  /** Warn/critical thresholds in milliseconds */
  thresholds: ThresholdConfig;
  /** Additional attributes for spans and events */
  attributes?: Record<string, string | number | boolean>;
}

export function useLoadingThreshold({
  name,
  isLoading,
  thresholds,
  attributes,
}: UseLoadingThresholdOptions): void {
  const spanRef = useRef<MonitoringSpan | null>(null);
  const warnTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const criticalTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (isLoading) {
      // Loading started — create a span to track duration
      spanRef.current =
        monitoringService?.startInactiveSpan({
          name,
          op: 'ui.loading',
          attributes,
        }) ?? null;

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
    } else {
      // Loading finished — end the span (duration captured automatically)
      spanRef.current?.end();
      spanRef.current = null;

      // Clear pending timers
      if (warnTimerRef.current) clearTimeout(warnTimerRef.current);
      if (criticalTimerRef.current) clearTimeout(criticalTimerRef.current);
      warnTimerRef.current = null;
      criticalTimerRef.current = null;
    }

    return () => {
      // End span if still active (unmount while loading)
      spanRef.current?.end();
      spanRef.current = null;
      if (warnTimerRef.current) clearTimeout(warnTimerRef.current);
      if (criticalTimerRef.current) clearTimeout(criticalTimerRef.current);
    };
  }, [isLoading, name, thresholds, attributes]);
}
