export const pipelineRunTableColumnClasses = {
  name: 'pf-m-width-30 pf-m-width-20-on-xl wrap-column',
  status: 'pf-m-width-10 pf-m-width-5-on-xl',
  testResultStatus: 'pf-m-width-10 pf-m-width-5-on-xl',
  started: 'pf-m-width-20 pf-m-width-10-on-xl',
  vulnerabilities: 'pf-m-hidden pf-m-visible-on-xl pf-m-width-10',
  type: 'pf-m-hidden pf-m-visible-on-xl pf-m-width-10',
  duration: 'pf-m-hidden pf-m-visible-on-xl pf-m-width-10',
  component: 'pf-m-hidden pf-m-visible-on-xl pf-m-width-10 wrap-column',
  trigger: 'pf-m-hidden pf-m-visible-on-xl pf-m-width-10 wrap-column',
  reference: 'pf-m-hidden pf-m-visible-on-xl pf-m-width-10 wrap-column',
  kebab: 'pf-v5-c-table__action',
};

const createPipelineRunListHeader = (showVulnerabilities: boolean) => () => {
  return [
    {
      title: 'Name',
      props: {
        className: pipelineRunTableColumnClasses.name,
      },
    },
    {
      title: 'Started',
      props: { className: pipelineRunTableColumnClasses.started },
    },
    ...(showVulnerabilities
      ? [
          {
            title: 'Fixable vulnerabilities',
            props: { className: pipelineRunTableColumnClasses.vulnerabilities },
          },
        ]
      : []),
    {
      title: 'Duration',
      props: { className: pipelineRunTableColumnClasses.duration },
    },
    {
      title: 'Status',
      props: { className: pipelineRunTableColumnClasses.status },
    },
    {
      title: <div>Test result</div>,
      props: {
        className: 'pf-m-width-10 pf-m-width-5-on-xl',
        info: {
          popover: 'The test result is the TEST_OUTPUT of the pipeline run integration test.',
        },
      },
    },
    {
      title: 'Type',
      props: { className: pipelineRunTableColumnClasses.type },
    },
    {
      title: 'Component',
      props: { className: pipelineRunTableColumnClasses.component },
    },
    {
      title: 'Trigger',
      props: { className: pipelineRunTableColumnClasses.trigger },
    },
    {
      title: 'Reference',
      props: { className: pipelineRunTableColumnClasses.reference },
    },
    {
      title: ' ',
      props: { className: pipelineRunTableColumnClasses.kebab },
    },
  ];
};

export const PipelineRunListHeader = createPipelineRunListHeader(false);

export const PipelineRunListHeaderWithVulnerabilities = createPipelineRunListHeader(true);
