export const pipelineRunTableColumnClasses = {
  name: 'pf-m-width-10 pf-m-width-15-on-xl',
  status: 'pf-m-width-10 pf-m-width-5-on-xl',
  testResultStatus: 'pf-m-width-10 pf-m-width-10-on-xl',
  started: 'pf-m-width-20 pf-m-width-10-on-xl',
  vulnerabilities: 'pf-m-hidden pf-m-visible-on-xl pf-m-width-15',
  type: 'pf-m-hidden pf-m-visible-on-xl pf-m-width-10',
  duration: 'pf-m-hidden pf-m-visible-on-xl pf-m-width-10',
  component: 'pf-m-hidden pf-m-visible-on-xl pf-m-width-15',
  workspace: 'pf-m-hidden pf-m-visible-on-xl pf-m-width-15',
  snapshot: 'pf-m-hidden pf-m-visible-on-xl pf-m-width-15',
  trigger: 'pf-m-hidden pf-m-visible-on-xl pf-m-width-10',
  reference: 'pf-m-hidden pf-m-visible-on-xl pf-m-width-10',
  kebab: 'pf-v5-c-table__action',
};

const createPipelineRunListHeader =
  (
    showVulnerabilities: boolean,
    showWorkspace: boolean,
    showTestResult: boolean,
    showComponent: boolean,
    showSnapshot: boolean,
    showTrigger: boolean = true,
    showReference: boolean = true,
  ) =>
  () => {
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
      ...(showTestResult
        ? [
            {
              title: <div>Test result</div>,
              props: {
                className: pipelineRunTableColumnClasses.testResultStatus,
                info: {
                  popover:
                    'The test result is the TEST_OUTPUT of the pipeline run integration test.',
                },
              },
            },
          ]
        : []),
      {
        title: 'Type',
        props: { className: pipelineRunTableColumnClasses.type },
      },
      ...(showComponent
        ? [
            {
              title: 'Component',
              props: { className: pipelineRunTableColumnClasses.component },
            },
          ]
        : []),
      ...(showSnapshot
        ? [
            {
              title: 'Snapshot',
              props: { className: pipelineRunTableColumnClasses.snapshot },
            },
          ]
        : []),
      ...(showWorkspace
        ? [
            {
              title: 'Namespace',
              props: { className: pipelineRunTableColumnClasses.workspace },
            },
          ]
        : []),
      ...(showTrigger
        ? [
            {
              title: 'Trigger',
              props: { className: pipelineRunTableColumnClasses.trigger },
            },
          ]
        : []),
      ...(showReference
        ? [
            {
              title: 'Reference',
              props: { className: pipelineRunTableColumnClasses.reference },
            },
          ]
        : []),
      {
        title: ' ',
        props: { className: pipelineRunTableColumnClasses.kebab },
      },
    ];
  };

export const PipelineRunListHeader = createPipelineRunListHeader(
  false,
  false,
  true,
  true,
  false,
  true,
  true,
);

export const PipelineRunListHeaderWithVulnerabilities = createPipelineRunListHeader(
  true,
  false,
  false,
  true,
  false,
  false,
  true,
);

export const PipelineRunListHeaderForRelease = createPipelineRunListHeader(
  false,
  true,
  false,
  false,
  true,
  false,
  false,
);
