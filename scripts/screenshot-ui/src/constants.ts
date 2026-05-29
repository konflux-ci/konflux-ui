import path from 'node:path';
import { fileURLToPath } from 'node:url';

const currentDir = path.dirname(fileURLToPath(import.meta.url));

export const REPO_ROOT = path.resolve(currentDir, '../../..');

export const ROUTES_DIR = path.join(REPO_ROOT, 'src/routes/page-routes');
export const PATHS_FILE = path.join(REPO_ROOT, 'src/routes/paths.ts');
export const ROUTES_INDEX_FILE = path.join(REPO_ROOT, 'src/routes/index.tsx');

export const DEFAULT_DEV_SERVER_URL = 'https://localhost:8080';
export const DEFAULT_BASE_REF = 'origin/main';

export const PARAM_HINTS: Record<string, import('./types.js').InteractionHint> = {
  workspaceName: 'namespace-select',
  applicationName: 'click-first-application',
  componentName: 'click-first-component',
  pipelineRunName: 'click-first-pipeline-run',
  taskRunName: 'click-first-task-run',
  commitName: 'click-first-commit',
  releaseName: 'click-first-release',
  snapshotName: 'click-first-snapshot',
  integrationTestName: 'click-first-integration-test',
  releasePlanName: 'click-first-release-plan',
};

export const TAB_SEGMENTS = new Set([
  'activity',
  'logs',
  'taskruns',
  'security',
  'components',
  'integrationtests',
  'snapshots',
  'releases',
  'versions',
  'linked-secrets',
  'pipelineruns',
  'list',
  'overview',
]);

export const SIDEBAR_LABELS: Record<string, string> = {
  applications: 'Applications',
  components: 'Components',
  secrets: 'Secrets',
  releases: 'Releases',
  issues: 'Issues',
};
