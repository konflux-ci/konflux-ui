export type NavigationStepType = 'goto' | 'act' | 'wait' | 'screenshot';

export type NavigationStep =
  | { type: 'goto'; url: string }
  | { type: 'act'; instruction: string }
  | { type: 'wait'; condition: 'networkidle' | 'domsettle' }
  | { type: 'screenshot'; name: string; fullPage?: boolean };

export type InteractionHint =
  | 'namespace-select'
  | 'sidebar-applications'
  | 'sidebar-components'
  | 'sidebar-secrets'
  | 'click-first-application'
  | 'click-first-component'
  | 'click-first-pipeline-run'
  | 'click-first-task-run'
  | 'click-first-commit'
  | 'click-first-release'
  | 'click-first-snapshot'
  | 'click-first-integration-test'
  | 'click-first-release-plan'
  | 'click-tab'
  | 'open-modal'
  | 'hover';

export type RouteTarget = {
  routePath: string;
  routeConstant?: string;
  routeFile: string;
  matchedComponents: string[];
  interactionHints: InteractionHint[];
  tabSegment?: string;
};

export type AnalysisResult = {
  changedUiFiles: string[];
  skippedFiles: string[];
  targets: RouteTarget[];
  navigationPlans: NavigationPlan[];
};

export type NavigationPlan = {
  id: string;
  label: string;
  changedComponents: string[];
  routePath: string;
  steps: NavigationStep[];
};

export type CaptureResult = {
  screenshots: CapturedScreenshot[];
  skipped: SkippedTarget[];
  namespace?: string;
};

export type CapturedScreenshot = {
  path: string;
  label: string;
  planId: string;
};

export type SkippedTarget = {
  planId: string;
  label: string;
  reason: string;
};

export type ScreenshotUiOptions = {
  baseRef: string;
  headRef: string;
  devServerUrl: string;
  namespace?: string;
  outputDir: string;
  authStatePath: string;
  cacheDir: string;
  headless: boolean;
};

export type StorageState = {
  cookies: Array<{
    name: string;
    value: string;
    domain: string;
    path: string;
    expires: number;
    httpOnly: boolean;
    secure: boolean;
    sameSite: 'Strict' | 'Lax' | 'None';
  }>;
  origins: Array<{
    origin: string;
    localStorage: Array<{ name: string; value: string }>;
  }>;
};
