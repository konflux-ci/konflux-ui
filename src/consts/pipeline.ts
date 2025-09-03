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
  | 'trigger'
  | 'reference';

export const PIPELINE_RUN_COLUMNS_DEFINITIONS: readonly ColumnDefinition<PipelineRunColumnKeys>[] =
  [
    { key: 'name', title: 'Name', sortable: true },
    { key: 'started', title: 'Started', sortable: true },
    { key: 'vulnerabilities', title: 'Fixable vulnerabilities', sortable: false },
    { key: 'duration', title: 'Duration', sortable: true },
    { key: 'status', title: 'Status', sortable: true },
    { key: 'type', title: 'Type', sortable: true },
    { key: 'trigger', title: 'Trigger', sortable: false },
    { key: 'reference', title: 'Reference', sortable: false },
  ];

export const INTEGRATION_TEST_PIPELINE_RUN_COLUMNS_DEFINITIONS: readonly ColumnDefinition<PipelineRunColumnKeys>[] =
  [
    { key: 'name', title: 'Name', sortable: true },
    { key: 'started', title: 'Started', sortable: true },
    { key: 'duration', title: 'Duration', sortable: true },
    { key: 'status', title: 'Status', sortable: true },
    { key: 'testResult', title: 'Test result', sortable: false },
    { key: 'type', title: 'Type', sortable: true },
    { key: 'component', title: 'Component', sortable: true },
    { key: 'trigger', title: 'Trigger', sortable: false },
    { key: 'reference', title: 'Reference', sortable: false },
  ];

// Default columns to show (based on current PipelineRunListHeaderWithVulnerabilities)
export const DEFAULT_VISIBLE_PIPELINE_RUN_COLUMNS: Set<PipelineRunColumnKeys> = new Set([
  'name',
  'started',
  'vulnerabilities',
  'duration',
  'status',
  'type',
  'trigger',
  'reference',
]);

// Columns that cannot be hidden (at least name should always be visible)
export const NON_HIDABLE_PIPELINE_RUN_COLUMNS: readonly PipelineRunColumnKeys[] = ['name'];

// Alternative default for tables without vulnerabilities (based on current PipelineRunListHeader)
export const DEFAULT_VISIBLE_PIPELINE_RUN_COLUMNS_NO_VULNERABILITIES: Set<PipelineRunColumnKeys> =
  new Set([
    'name',
    'started',
    'duration',
    'status',
    'testResult',
    'type',
    'component',
    'trigger',
    'reference',
  ]);

// Default for snapshot context (excludes snapshot column since we're already in snapshot details)
export const DEFAULT_VISIBLE_PIPELINE_RUN_COLUMNS_SNAPSHOT_CONTEXT: Set<PipelineRunColumnKeys> =
  new Set([
    'name',
    'started',
    'vulnerabilities',
    'duration',
    'status',
    'type',
    'trigger',
    'reference',
  ]);

// Activity Pipeline specific column types
export type ActivityPipelineRunColumnKeys =
  | 'name'
  | 'started'
  | 'vulnerabilities'
  | 'duration'
  | 'status'
  | 'type'
  | 'trigger'
  | 'reference';

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
    { key: 'reference', title: 'Reference', sortable: false },
  ];

// Default visible columns for Activity Pipeline
export const DEFAULT_VISIBLE_ACTIVITY_PIPELINE_RUN_COLUMNS: Set<ActivityPipelineRunColumnKeys> =
  new Set([
    'name',
    'started',
    'vulnerabilities',
    'duration',
    'status',
    'type',
    'trigger',
    'reference',
  ]);
