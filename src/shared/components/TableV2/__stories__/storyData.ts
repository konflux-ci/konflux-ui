import { type ColumnDefinition } from '~/shared/components/TableV2';

export interface PipelineRun {
  uid: string;
  name: string;
  status: 'Succeeded' | 'Failed' | 'Running' | 'Pending';
  component: string;
  started: string;
  duration: string;
}

const STATUSES: PipelineRun['status'][] = ['Succeeded', 'Failed', 'Running', 'Pending'];
const COMPONENTS = ['frontend', 'backend', 'auth-service', 'database'];

export const generateMockData = (count: number): PipelineRun[] =>
  Array.from({ length: count }, (_, i) => ({
    uid: `uid-${i}`,
    name: `pipeline-run-${i}`,
    status: STATUSES[i % 4],
    component: COMPONENTS[i % 4],
    started: new Date(2026, 5, 1, 10, i).toISOString(),
    duration: `${(i % 10) + 1}m`,
  }));

export const columns: ColumnDefinition<PipelineRun>[] = [
  {
    id: 'name',
    header: 'Name',
    accessorFn: (row) => row.name,
    size: 3,
    sortable: true,
    nonHidable: true,
  },
  {
    id: 'status',
    header: 'Status',
    accessorFn: (row) => row.status,
    size: 2,
    sortable: true,
  },
  {
    id: 'component',
    header: 'Component',
    accessorFn: (row) => row.component,
    size: 2,
  },
  {
    id: 'started',
    header: 'Started',
    accessorFn: (row) => row.started,
    size: 2,
    sortable: true,
  },
  {
    id: 'duration',
    header: 'Duration',
    accessorFn: (row) => row.duration,
    size: 1,
  },
];

export const getRowId = (row: PipelineRun) => row.uid;

/**
 * Columns with responsive breakpoints for responsive-column stories.
 * Same as `columns` but with visibleFrom set on some columns.
 */
export const responsiveColumns: ColumnDefinition<PipelineRun>[] = [
  { ...columns[0] },
  { ...columns[1], visibleFrom: 'md' },
  { ...columns[2], visibleFrom: 'lg' },
  { ...columns[3], visibleFrom: 'xl' },
  { ...columns[4], visibleFrom: 'xl' },
];

/**
 * Columns with mixed fixed and flex widths.
 */
export const mixedWidthColumns: ColumnDefinition<PipelineRun>[] = [
  { ...columns[0], width: '200px', size: undefined },
  { ...columns[1], size: 2 },
  { ...columns[2], size: 3 },
  { ...columns[3], width: '150px', size: undefined },
  { ...columns[4], size: 1 },
];
