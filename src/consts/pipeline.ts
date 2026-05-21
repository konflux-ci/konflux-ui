import { ColumnDefinition } from '../shared/components/table/ColumnManagement';

export enum PipelineResourceType {
  git = 'git',
  image = 'image',
  cluster = 'cluster',
  storage = 'storage',
}

export enum VolumeTypes {
  NoWorkspace = 'noWorkspace',
  EmptyDirectory = 'emptyDirectory',
  ConfigMap = 'configMap',
  Secret = 'secret',
  PVC = 'pvc',
  VolumeClaimTemplate = 'volumeClaimTemplate',
}

export enum SecretAnnotationId {
  Git = 'git',
  Image = 'docker',
}

export const preferredNameAnnotation = 'pipeline.openshift.io/preferredName';

export const PIPELINE_SERVICE_ACCOUNT_PREFIX = 'build-pipeline-';

export const COMMON_SECRETS_LABEL = 'build.appstudio.openshift.io/common-secret';

export const PIPELINE_NAMESPACE = 'openshift-pipelines';

// Pipeline Run Column Configurations
export type PipelineRunColumnKeys =
  | 'name'
  | 'started'
  | 'vulnerabilities'
  | 'duration'
  | 'status'
  | 'testResult'
  | 'type'
  | 'component'
  | 'snapshot'
  | 'namespace'
  | 'trigger';

/** Legacy column key; reference content is shown inside the Trigger column. */
const DEPRECATED_REFERENCE_COLUMN = 'reference';

export const PIPELINE_RUN_COLUMNS_DEFINITIONS: readonly ColumnDefinition<PipelineRunColumnKeys>[] =
  [
    { key: 'name', title: 'Name', sortable: true },
    { key: 'started', title: 'Started', sortable: true },
    { key: 'vulnerabilities', title: 'Fixable vulnerabilities', sortable: false },
    { key: 'duration', title: 'Duration', sortable: true },
    { key: 'status', title: 'Status', sortable: true },
    { key: 'testResult', title: 'Test output', sortable: false },
    { key: 'type', title: 'Type', sortable: true },
    { key: 'trigger', title: 'Trigger', sortable: false },
  ];

export const INTEGRATION_TEST_PIPELINE_RUN_COLUMNS_DEFINITIONS: readonly ColumnDefinition<PipelineRunColumnKeys>[] =
  [
    { key: 'name', title: 'Name', sortable: true },
    { key: 'started', title: 'Started', sortable: true },
    { key: 'duration', title: 'Duration', sortable: true },
    { key: 'status', title: 'Status', sortable: true },
    { key: 'testResult', title: 'Test output', sortable: false },
    { key: 'type', title: 'Type', sortable: true },
    { key: 'component', title: 'Component', sortable: true },
    { key: 'trigger', title: 'Trigger', sortable: false },
  ];

// Default columns to show (based on current PipelineRunListHeaderWithVulnerabilities)
export const DEFAULT_VISIBLE_PIPELINE_RUN_COLUMNS: Set<PipelineRunColumnKeys> = new Set([
  'name',
  'started',
  'vulnerabilities',
  'duration',
  'status',
  'testResult',
  'type',
  'trigger',
]);

// Columns that cannot be hidden (at least name should always be visible)
export const NON_HIDABLE_PIPELINE_RUN_COLUMNS: readonly PipelineRunColumnKeys[] = ['name'];

// Alternative default for tables without vulnerabilities (based on current PipelineRunListHeader)
export const DEFAULT_VISIBLE_PIPELINE_RUN_COLUMNS_NO_VULNERABILITIES: Set<PipelineRunColumnKeys> =
  new Set(['name', 'started', 'duration', 'status', 'testResult', 'type', 'component', 'trigger']);

// Default for snapshot context (excludes snapshot column since we're already in snapshot details)
export const DEFAULT_VISIBLE_PIPELINE_RUN_COLUMNS_SNAPSHOT_CONTEXT: Set<PipelineRunColumnKeys> =
  new Set(['name', 'started', 'vulnerabilities', 'duration', 'status', 'type', 'trigger']);

// Activity Pipeline specific column types
export type ActivityPipelineRunColumnKeys =
  | 'name'
  | 'started'
  | 'vulnerabilities'
  | 'duration'
  | 'status'
  | 'type'
  | 'trigger';

// Column definitions specifically for Activity Pipeline (subset of main columns)
export const ACTIVITY_PIPELINE_RUN_COLUMNS_DEFINITIONS: readonly ColumnDefinition<ActivityPipelineRunColumnKeys>[] =
  [
    { key: 'name', title: 'Name', sortable: true },
    { key: 'started', title: 'Started', sortable: true },
    { key: 'vulnerabilities', title: 'Fixable vulnerabilities', sortable: false },
    { key: 'duration', title: 'Duration', sortable: true },
    { key: 'status', title: 'Status', sortable: true },
    { key: 'type', title: 'Type', sortable: true },
    { key: 'trigger', title: 'Trigger', sortable: false },
  ];

// Default visible columns for Activity Pipeline
export const DEFAULT_VISIBLE_ACTIVITY_PIPELINE_RUN_COLUMNS: Set<ActivityPipelineRunColumnKeys> =
  new Set(['name', 'started', 'vulnerabilities', 'duration', 'status', 'type', 'trigger']);

const VALID_PIPELINE_RUN_COLUMN_KEYS = new Set<string>([
  ...PIPELINE_RUN_COLUMNS_DEFINITIONS.map((c) => c.key),
  'snapshot',
  'namespace',
  'component',
]);

/**
 * Maps persisted column prefs to current keys (Reference merged into Trigger).
 */
export const resolvePipelineRunVisibleColumns = (
  persisted: string[] | undefined,
  defaults: Set<PipelineRunColumnKeys>,
): Set<PipelineRunColumnKeys> => {
  if (!Array.isArray(persisted) || persisted.length === 0) {
    return new Set(defaults);
  }

  const resolved: PipelineRunColumnKeys[] = [];
  let hadReference = false;

  persisted.forEach((key) => {
    if (key === DEPRECATED_REFERENCE_COLUMN) {
      hadReference = true;
      return;
    }
    if (
      VALID_PIPELINE_RUN_COLUMN_KEYS.has(key) &&
      !resolved.includes(key as PipelineRunColumnKeys)
    ) {
      resolved.push(key as PipelineRunColumnKeys);
    }
  });

  if (hadReference && !resolved.includes('trigger')) {
    resolved.push('trigger');
  }

  return resolved.length > 0 ? new Set(resolved) : new Set(defaults);
};
