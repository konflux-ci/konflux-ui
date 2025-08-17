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

// Type defined in ReleasePipelineRunTab.tsx to avoid duplication
type PipelineRunColumnKeys = 'name' | 'startTime' | 'duration' | 'type' | 'snapshot' | 'namespace' | 'status' | 'completionTime';

interface ReleasePipelineListHeaderProps {
  visibleColumns: Set<PipelineRunColumnKeys>;
}

const ReleasePipelineListHeader = ({ visibleColumns }: ReleasePipelineListHeaderProps) => {
  const allColumns = [
    {
      key: 'name',
      title: 'Name',
      props: { className: releasePipelineRunListColumnClasses.name },
    },
    {
      key: 'startTime',
      title: 'Started',
      props: { className: releasePipelineRunListColumnClasses.startTime },
    },
    {
      key: 'duration',
      title: 'Duration',
      props: { className: releasePipelineRunListColumnClasses.duration },
    },
    {
      key: 'type',
      title: 'Type',
      props: { className: releasePipelineRunListColumnClasses.type },
    },
    {
      key: 'snapshot',
      title: 'Snapshot',
      props: { className: releasePipelineRunListColumnClasses.snapshot },
    },
    {
      key: 'namespace',
      title: 'Namespace',
      props: { className: releasePipelineRunListColumnClasses.namespace },
    },
    {
      key: 'status',
      title: 'Status',
      props: { className: releasePipelineRunListColumnClasses.status },
    },
    {
      key: 'completionTime',
      title: 'Completed',
      props: { className: releasePipelineRunListColumnClasses.completionTime },
    },
  ];

  return allColumns.filter(column => visibleColumns.has(column.key as PipelineRunColumnKeys));
};

export default ReleasePipelineListHeader;
