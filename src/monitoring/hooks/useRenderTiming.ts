import { useEffect, useRef } from 'react';
import { monitoringService } from '~/monitoring';
import type { ThresholdConfig } from '~/monitoring/thresholds';
import type { MonitoringSpan } from '~/monitoring/types';

interface UseRenderTimingOptions {
  /** Metric name, e.g. 'pipelineruns.list.render' */
  name: string;
  /** Set to true when the component is interactive/data is loaded */
  isReady: boolean;
  /** Warn/critical thresholds in milliseconds */
  thresholds: ThresholdConfig;
  /** Additional attributes for spans and metrics */
  attributes?: Record<string, string | number | boolean>;
}

export function useRenderTiming({
  name,
  isReady,
  thresholds,
  attributes,
}: UseRenderTimingOptions): void {
  const startTimeRef = useRef<number>(performance.now());
  const spanRef = useRef<MonitoringSpan | null>(null);
  const reportedRef = useRef(false);

  // Start span on mount
  useEffect(() => {
    spanRef.current =
      monitoringService?.startInactiveSpan({
        name,
        op: 'ui.render',
        attributes,
      }) ?? null;

    return () => {
      // If unmounted before ready, end the span
      if (spanRef.current && !reportedRef.current) {
        spanRef.current.end();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Report when isReady transitions to true
  useEffect(() => {
    if (!isReady || reportedRef.current) return;
    reportedRef.current = true;

    const duration = performance.now() - startTimeRef.current;

    // End the span — duration is captured automatically by Sentry
    spanRef.current?.setAttribute('duration_ms', Math.round(duration));
    spanRef.current?.end();

    // Check thresholds
    if (duration > thresholds.critical) {
      monitoringService?.captureMessage(
        `[performance] ${name} took ${Math.round(duration)}ms (critical threshold: ${thresholds.critical}ms)`,
        'error',
        { duration, threshold: thresholds.critical, ...attributes },
      );
    } else if (duration > thresholds.warn) {
      monitoringService?.captureMessage(
        `[performance] ${name} took ${Math.round(duration)}ms (warn threshold: ${thresholds.warn}ms)`,
        'warn',
        { duration, threshold: thresholds.warn, ...attributes },
      );
    }
  }, [isReady, name, thresholds, attributes]);
}
