import { ColumnDefinition } from '../../../shared/components/table/ColumnManagement';

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
    { key: 'testResult', title: 'Test result', sortable: false },
    { key: 'type', title: 'Type', sortable: true },
    { key: 'component', title: 'Component', sortable: true },
    { key: 'snapshot', title: 'Snapshot', sortable: false },
    { key: 'namespace', title: 'Namespace', sortable: false },
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
