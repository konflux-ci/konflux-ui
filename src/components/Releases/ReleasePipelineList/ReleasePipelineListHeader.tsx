import {
  generateDynamicColumnClasses,
  COMMON_COLUMN_CONFIGS,
} from '../../../shared/components/table/dynamic-columns';

type ReleasePipelineRunColumnKeys =
  | 'name'
  | 'startTime'
  | 'duration'
  | 'type'
  | 'snapshot'
  | 'namespace'
  | 'status'
  | 'completionTime';

export const getDynamicReleasePipelineColumnClasses = (
  visibleColumns: Set<ReleasePipelineRunColumnKeys>,
) => {
  return generateDynamicColumnClasses(visibleColumns, COMMON_COLUMN_CONFIGS, {
    specialClasses: { name: 'wrap-column' },
  });
};

export const releasePipelineRunListColumnClasses = {
  name: 'pf-m-width-15 wrap-column',
  type: 'pf-m-hidden pf-m-visible-on-xl pf-m-width-10',
  snapshot: 'pf-m-width-20 pf-m-width-15-on-lg',
  namespace: 'pf-m-hidden pf-m-visible-on-xl pf-m-width-15',
  startTime: 'pf-m-hidden pf-m-visible-on-lg pf-m-width-15',
  duration: 'pf-m-hidden pf-m-visible-on-lg pf-m-width-15',
  status: 'pf-m-hidden pf-m-visible-on-lg pf-m-width-10',
  completionTime: 'pf-m-hidden pf-m-visible-on-xl pf-m-width-15',
};

interface ReleasePipelineListHeaderProps {
  visibleColumns: Set<ReleasePipelineRunColumnKeys>;
}

const ReleasePipelineListHeader = ({ visibleColumns }: ReleasePipelineListHeaderProps) => {
  // Use dynamic classes if available, otherwise fall back to static classes
  const columnClasses = getDynamicReleasePipelineColumnClasses(visibleColumns);

  const allColumns = [
    {
      key: 'name',
      title: 'Name',
      props: { className: columnClasses.name },
    },
    {
      key: 'startTime',
      title: 'Started',
      props: { className: columnClasses.startTime },
    },
    {
      key: 'duration',
      title: 'Duration',
      props: { className: columnClasses.duration },
    },
    {
      key: 'type',
      title: 'Type',
      props: { className: columnClasses.type },
    },
    {
      key: 'snapshot',
      title: 'Snapshot',
      props: { className: columnClasses.snapshot },
    },
    {
      key: 'namespace',
      title: 'Namespace',
      props: { className: columnClasses.namespace },
    },
    {
      key: 'status',
      title: 'Status',
      props: { className: columnClasses.status },
    },
    {
      key: 'completionTime',
      title: 'Completed',
      props: { className: columnClasses.completionTime },
    },
  ];

  const filtered = allColumns.filter((column) =>
    visibleColumns.has(column.key as ReleasePipelineRunColumnKeys),
  );
  return [
    ...filtered,
    {
      title: ' ',
      props: { className: getDynamicReleasePipelineColumnClasses(visibleColumns).kebab },
    },
  ];
};

export default ReleasePipelineListHeader;
