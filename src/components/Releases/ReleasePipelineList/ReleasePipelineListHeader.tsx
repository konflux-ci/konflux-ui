export const releasePipelineRunListColumnClasses = {
  name: 'pf-m-width-15 wrap-column',
  type: 'pf-m-hidden pf-m-visible-on-xl pf-m-width-10',
  snapshot: 'pf-m-width-20 pf-m-width-15-on-lg',
  namespace: 'pf-m-hidden pf-m-visible-on-xl pf-m-width-15',
  startTime: 'pf-m-hidden pf-m-visible-on-lg pf-m-width-15',
  duration: 'pf-m-hidden pf-m-visible-on-lg pf-m-width-15',
};

const ReleasePipelineListHeader = () => {
  return [
    {
      title: 'Name',
      props: { className: releasePipelineRunListColumnClasses.name },
    },
    {
      title: 'Started',
      props: { className: releasePipelineRunListColumnClasses.startTime },
    },
    {
      title: 'Duration',
      props: { className: releasePipelineRunListColumnClasses.duration },
    },
    {
      title: 'Type',
      props: { className: releasePipelineRunListColumnClasses.type },
    },
    {
      title: 'Snapshot',
      props: { className: releasePipelineRunListColumnClasses.snapshot },
    },
    {
      title: 'Namespace',
      props: { className: releasePipelineRunListColumnClasses.namespace },
    },
  ];
};

export default ReleasePipelineListHeader;
