import { ColumnDefinition } from '../../../shared/components/table/ColumnManagement';

export type ReleasePlanColumnKeys =
  | 'name'
  | 'application'
  | 'target'
  | 'autoRelease'
  | 'standingAttribution'
  | 'status'
  | 'rpa';

export const RELEASE_PLAN_COLUMNS_DEFINITIONS: readonly ColumnDefinition<ReleasePlanColumnKeys>[] =
  [
    { key: 'name', title: 'Name', sortable: true },
    { key: 'application', title: 'Application', sortable: true },
    { key: 'target', title: 'Target Namespace', sortable: false },
    { key: 'autoRelease', title: 'Auto release', sortable: false },
    { key: 'standingAttribution', title: 'Standing attribution', sortable: false },
    { key: 'status', title: 'Status', sortable: false },
    { key: 'rpa', title: 'Release plan admission', sortable: false },
  ];

// Default columns to show (all columns visible by default)
export const DEFAULT_VISIBLE_RELEASE_PLAN_COLUMNS: Set<ReleasePlanColumnKeys> = new Set([
  'name',
  'application',
  'target',
  'autoRelease',
  'standingAttribution',
  'status',
  'rpa',
]);

// Columns that cannot be hidden (name should always be visible)
export const NON_HIDABLE_RELEASE_PLAN_COLUMNS: readonly ReleasePlanColumnKeys[] = ['name'];
