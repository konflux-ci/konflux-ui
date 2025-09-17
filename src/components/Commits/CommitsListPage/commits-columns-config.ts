import { ColumnDefinition } from '~/shared/components/table/ColumnManagement';
import {
  generateDynamicColumnClasses,
  COMMON_COLUMN_CONFIGS,
} from '~/shared/components/table/dynamic-columns';

export const getDynamicCommitsColumnClasses = (visibleColumns: Set<CommitColumnKeys>) => {
  return generateDynamicColumnClasses(visibleColumns, COMMON_COLUMN_CONFIGS, {
    specialClasses: {
      name: 'wrap-column',
      branch: 'commits-list__branch',
    },
  });
};

export const commitsTableColumnClasses = {
  name: 'pf-m-width-35 wrap-column',
  branch: 'pf-m-width-20 pf-m-width-10-on-lg commits-list__branch',
  component: 'pf-m-width-35 pf-m-width-25-on-lg pf-m-width-15-on-xl',
  byUser: 'pf-m-hidden pf-m-visible-on-xl pf-m-width-10',
  committedAt: 'pf-m-hidden pf-m-visible-on-lg pf-m-width-20 pf-m-width-10-on-xl',
  status: 'pf-m-hidden pf-m-visible-on-xl pf-m-width-10',
  kebab: 'pf-v5-c-table__action',
};

export type CommitColumnKeys = Exclude<keyof typeof commitsTableColumnClasses, 'kebab'>;

export const COMMIT_COLUMN_ORDER: CommitColumnKeys[] = [
  'name',
  'branch',
  'component',
  'byUser',
  'committedAt',
  'status',
];

export const DEFAULT_VISIBLE_COMMIT_COLUMNS: Set<CommitColumnKeys> = new Set(COMMIT_COLUMN_ORDER);

export const NON_HIDABLE_COMMIT_COLUMNS: readonly CommitColumnKeys[] = ['name'];

export const COMMIT_COLUMNS_DEFINITIONS: readonly ColumnDefinition<CommitColumnKeys>[] = [
  { key: 'name', title: 'Name' },
  { key: 'branch', title: 'Branch' },
  { key: 'component', title: 'Component' },
  { key: 'byUser', title: 'By user' },
  { key: 'committedAt', title: 'Latest commit at' },
  { key: 'status', title: 'Status' },
];

export const commitsColumns = [
  { title: 'Name', className: commitsTableColumnClasses.name, sortable: true },
  { title: 'Branch', className: commitsTableColumnClasses.branch, sortable: true },
  { title: 'Component', className: commitsTableColumnClasses.component },
  { title: 'By user', className: commitsTableColumnClasses.byUser, sortable: true },
  { title: 'Latest commit at', className: commitsTableColumnClasses.committedAt, sortable: true },
  { title: 'Status', className: commitsTableColumnClasses.status, sortable: true },
];
