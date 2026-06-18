export type ReleasePackageInfo = {
  description: string;
  fullName: string;
  shortName: string;
  title: string;
};

export type ReleaseAnnotation = {
  description: string;
  failureMsg: string;
  file: string;
  fullPath: string;
  packageInfo: ReleasePackageInfo;
  packagePath: string;
  row: number;
  shortName: string;
  title: string;
  warningOrFailure: 'warning' | 'failure';
};

export type ConformaPolicies = {
  releaseAnnotations: {
    [key: string]: ReleaseAnnotation[];
  };
  releasePackages: {
    [key: string]: ReleasePackageInfo;
  };
};

export enum CONFORMA_RESULT_STATUS {
  violations = 'Failed',
  successes = 'Success',
  warnings = 'Warning',
}

export type ConformaRule = {
  metadata: {
    title: string;
    description: string;
    collections: string[];
    code: string;

    effective_on?: string;
    solution?: string;
  };
  msg: string;
};

export type ComponentConformaResult = {
  containerImage: string;
  name: string;
  success: boolean;
  violations?: ConformaRule[];
  successes?: ConformaRule[];
  warnings?: ConformaRule[];
};

export type ConformaResult = {
  components: ComponentConformaResult[];
};

export type UIConformaData = {
  title: string;
  description: string;
  status: CONFORMA_RESULT_STATUS;
  timestamp?: string;
  component: string;
  msg?: string;
  collection?: string[];
  solution?: string;
  image?: string;
  /** Policy rule code — stable identifier used as primary group key. Optional for backward-compat. */
  code?: string;
};

export type ConformaResultRow = UIConformaData;

export type ComponentConformaStatus = {
  componentName: string;
  status: 'pass' | 'warning' | 'fail' | 'unknown';
  violationCount: number;
  warningCount: number;
  successCount: number;
  pipelineRunName?: string;
};

export type ConformaRefreshState = {
  /** React Query dataUpdatedAt timestamp in ms epoch; 0 when not yet fetched. */
  lastFetchedAt: number;
  /** True while the TaskRun list query is actively re-fetching. */
  isRefreshing: boolean;
  /** True when the WebSocket connection has degraded to polling after retries. */
  hasLiveUpdatesPaused: boolean;
  /** Invalidates the TaskRun list query; log queries are unaffected. */
  onRefresh: () => void;
};

export type ApplicationConformaResults = {
  componentStatuses: ComponentConformaStatus[];
  allResults: ConformaResultRow[];
  totalComponents: number;
  totalFailed: number;
  totalViolations: number;
  totalWarnings: number;
  totalSuccesses: number;
  loaded: boolean;
  settling: boolean;
  error: unknown;
  refresh: ConformaRefreshState;
};
