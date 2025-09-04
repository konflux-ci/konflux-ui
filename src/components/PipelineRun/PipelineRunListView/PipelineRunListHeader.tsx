import { PipelineRunColumnKeys } from '../../../consts/pipeline';
import {
  generateDynamicColumnClasses,
  COMMON_COLUMN_CONFIGS,
} from '../../../shared/components/table/dynamic-columns';

export const getDynamicColumnClasses = (visibleColumns: Set<PipelineRunColumnKeys>) => {
  const rawClasses = generateDynamicColumnClasses(visibleColumns, COMMON_COLUMN_CONFIGS);

  const mappedClasses: Record<string, string> = Object.entries(rawClasses).reduce(
    (acc, [key, value]) => {
      let mappedKey = key;
      if (key === 'testResult') mappedKey = 'testResultStatus';
      if (key === 'namespace') mappedKey = 'workspace';
      acc[mappedKey] = value;
      return acc;
    },
    {} as Record<string, string>,
  );

  return mappedClasses;
};

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
  reference: 'pf-m-hidden pf-m-visible-on-xl pf-m-width-15',
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
  false,
  false,
  true,
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

// New dynamic header function that works with visible columns
export const getPipelineRunListHeader = (visibleColumns: Set<PipelineRunColumnKeys>) => () => {
  const dynamicClasses = getDynamicColumnClasses(visibleColumns);
  const columns = [];

  if (visibleColumns.has('name')) {
    columns.push({
      title: 'Name',
      props: {
        className: dynamicClasses.name,
      },
    });
  }

  if (visibleColumns.has('started')) {
    columns.push({
      title: 'Started',
      props: { className: dynamicClasses.started },
    });
  }

  if (visibleColumns.has('vulnerabilities')) {
    columns.push({
      title: 'Fixable vulnerabilities',
      props: { className: dynamicClasses.vulnerabilities },
    });
  }

  if (visibleColumns.has('duration')) {
    columns.push({
      title: 'Duration',
      props: { className: dynamicClasses.duration },
    });
  }

  if (visibleColumns.has('status')) {
    columns.push({
      title: 'Status',
      props: { className: dynamicClasses.status },
    });
  }

  if (visibleColumns.has('testResult')) {
    columns.push({
      title: <div>Test result</div>,
      props: {
        className: dynamicClasses.testResultStatus,
        info: {
          popover: 'The test result is the TEST_OUTPUT of the pipeline run integration test.',
        },
      },
    });
  }

  if (visibleColumns.has('type')) {
    columns.push({
      title: 'Type',
      props: { className: dynamicClasses.type },
    });
  }

  if (visibleColumns.has('component')) {
    columns.push({
      title: 'Component',
      props: { className: dynamicClasses.component },
    });
  }

  if (visibleColumns.has('snapshot')) {
    columns.push({
      title: 'Snapshot',
      props: { className: dynamicClasses.snapshot },
    });
  }

  if (visibleColumns.has('namespace')) {
    columns.push({
      title: 'Namespace',
      props: { className: dynamicClasses.workspace },
    });
  }

  if (visibleColumns.has('trigger')) {
    columns.push({
      title: 'Trigger',
      props: { className: dynamicClasses.trigger },
    });
  }

  if (visibleColumns.has('reference')) {
    columns.push({
      title: 'Reference',
      props: { className: dynamicClasses.reference },
    });
  }

  // Always add kebab menu
  columns.push({
    title: ' ',
    props: { className: dynamicClasses.kebab },
  });

  return columns;
};
