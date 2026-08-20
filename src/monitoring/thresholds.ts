/** Threshold configuration for performance monitoring */
export interface ThresholdConfig {
  /** Duration in milliseconds that triggers a warning */
  warn: number;
  /** Duration in milliseconds that triggers an error */
  critical: number;
}

/** Performance thresholds for PipelineRuns pages */
export const THRESHOLDS = {
  PIPELINERUNS_LIST_RENDER: { warn: 3000, critical: 8000 } as ThresholdConfig,
  PIPELINERUNS_DETAILS_RENDER: { warn: 2000, critical: 5000 } as ThresholdConfig,
  LOADING_INDICATOR: { warn: 5000, critical: 15000 } as ThresholdConfig,
  TOPOLOGY_GRAPH: { warn: 1000, critical: 3000 } as ThresholdConfig,
  PAGINATION: { warn: 3000, critical: 8000 } as ThresholdConfig,
} as const;
