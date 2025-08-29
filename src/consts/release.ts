import { ColumnDefinition } from '../shared/components/table/ColumnManagement';

export enum ReleaseLabel {
  AUTOMATED = 'release.appstudio.openshift.io/automated',
  AUTHOR = 'release.appstudio.openshift.io/author',
}

export type ReleaseColumnKeys =
  | 'name'
  | 'created'
  | 'duration'
  | 'status'
  | 'releasePlan'
  | 'releaseSnapshot'
  | 'tenantCollectorPipelineRun'
  | 'tenantPipelineRun'
  | 'managedPipelineRun'
  | 'finalPipelineRun';

export const RELEASE_COLUMNS_DEFINITIONS: readonly ColumnDefinition<ReleaseColumnKeys>[] = [
  { key: 'name', title: 'Name', sortable: true },
  { key: 'created', title: 'Created', sortable: true },
  { key: 'duration', title: 'Duration', sortable: false },
  { key: 'status', title: 'Status', sortable: false },
  { key: 'releasePlan', title: 'Release Plan', sortable: false },
  { key: 'releaseSnapshot', title: 'Release Snapshot', sortable: false },
  { key: 'tenantCollectorPipelineRun', title: 'Tenant Collector', sortable: false },
  { key: 'tenantPipelineRun', title: 'Tenant Pipeline', sortable: false },
  { key: 'managedPipelineRun', title: 'Managed Pipeline', sortable: false },
  { key: 'finalPipelineRun', title: 'Final Pipeline', sortable: false },
];

// Default columns to show
export const DEFAULT_VISIBLE_RELEASE_COLUMNS: Set<ReleaseColumnKeys> = new Set([
  'name',
  'created',
  'duration',
  'status',
  'releasePlan',
  'releaseSnapshot',
]);

// Columns that cannot be hidden
export const NON_HIDABLE_RELEASE_COLUMNS: readonly ReleaseColumnKeys[] = ['name'];

// Column order for consistent display across components
export const RELEASE_COLUMN_ORDER: readonly ReleaseColumnKeys[] = [
  'name',
  'created',
  'duration',
  'status',
  'releasePlan',
  'releaseSnapshot',
  'tenantCollectorPipelineRun',
  'tenantPipelineRun',
  'managedPipelineRun',
  'finalPipelineRun',
];

// Sortable headers enum
export const enum SortableHeaders {
  name,
  created,
}
