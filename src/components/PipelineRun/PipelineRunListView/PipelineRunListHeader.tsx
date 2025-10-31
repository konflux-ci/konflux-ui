import { SortByDirection, ThProps } from '@patternfly/react-table';
import { PipelineRunColumnKeys, PIPELINE_RUN_COLUMNS_DEFINITIONS } from '../../../consts/pipeline';
import {
  generateDynamicColumnClasses,
  COMMON_COLUMN_CONFIGS,
} from '../../../shared/components/table/dynamic-columns';
import { createTableHeaders, ColumnConfig } from '../../../shared/components/table/utils';

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

export const getPipelineRunListHeader = (
  visibleColumns: Set<PipelineRunColumnKeys>,
  activeSortIndex?: number,
  activeSortDirection?: SortByDirection,
  onSort?: ThProps['sort']['onSort'],
) => {
  const dynamicClasses = getDynamicColumnClasses(visibleColumns);

  const FALLBACK_TITLES: Record<PipelineRunColumnKeys, string> = {
    name: 'Name',
    started: 'Started',
    vulnerabilities: 'Fixable vulnerabilities',
    duration: 'Duration',
    status: 'Status',
    type: 'Type',
    component: 'Component',
    snapshot: 'Snapshot',
    namespace: 'Namespace',
    trigger: 'Trigger',
    reference: 'Reference',
    testResult: 'Test result',
  };

  const columnConfigs: ColumnConfig[] = Array.from(visibleColumns).map((columnKey) => {
    const columnDef = PIPELINE_RUN_COLUMNS_DEFINITIONS.find((def) => def.key === columnKey);
    return {
      title: columnDef?.title ?? FALLBACK_TITLES[columnKey] ?? String(columnKey),
      className: dynamicClasses[columnKey] || '',
      sortable: columnDef?.sortable ?? false,
    };
  });

  columnConfigs.push({
    title: ' ',
    className: dynamicClasses.kebab || '',
    sortable: false,
  });

  return createTableHeaders(columnConfigs)(activeSortIndex, activeSortDirection, onSort);
};
