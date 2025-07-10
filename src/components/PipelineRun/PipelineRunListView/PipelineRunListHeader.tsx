export const pipelineRunTableColumnClasses = {
  name: 'pf-m-width-10 pf-m-width-15-on-xl',
  started: 'pf-m-width-20 pf-m-width-10-on-xl',
  vulnerabilities: 'pf-m-hidden pf-m-visible-on-xl pf-m-width-15',
  duration: 'pf-m-hidden pf-m-visible-on-xl pf-m-width-10',
  status: 'pf-m-width-10 pf-m-width-5-on-xl',
  testResultStatus: 'pf-m-width-5 pf-m-width-5-on-xl',
  type: 'pf-m-hidden pf-m-visible-on-xl pf-m-width-10',
  component: 'pf-m-hidden pf-m-visible-on-xl pf-m-width-15',
  snapshot: 'pf-m-hidden pf-m-visible-on-xl pf-m-width-15',
  workspace: 'pf-m-hidden pf-m-visible-on-xl pf-m-width-15',
  trigger: 'pf-m-hidden pf-m-visible-on-xl pf-m-width-10',
  reference: 'pf-m-hidden pf-m-visible-on-xl pf-m-width-15',
  kebab: 'pf-v5-c-table__action',
};

export type PipelineRunColumnKey = keyof typeof pipelineRunTableColumnClasses;

export const pipelineRunColumns = [
  { key: 'name', title: 'Name', className: pipelineRunTableColumnClasses.name, sortable: false },
  { key: 'started', title: 'Started', className: pipelineRunTableColumnClasses.started, sortable: false },
  { key: 'vulnerabilities', title: 'Fixable vulnerabilities', className: pipelineRunTableColumnClasses.vulnerabilities, sortable: false },
  { key: 'duration', title: 'Duration', className: pipelineRunTableColumnClasses.duration, sortable: false },
  { key: 'status', title: 'Status', className: pipelineRunTableColumnClasses.status, sortable: false },
  { key: 'testResultStatus', title: 'Test result', className: pipelineRunTableColumnClasses.testResultStatus, sortable: false },
  { key: 'type', title: 'Type', className: pipelineRunTableColumnClasses.type, sortable: false },
  { key: 'component', title: 'Component', className: pipelineRunTableColumnClasses.component, sortable: false },
  { key: 'snapshot', title: 'Snapshot', className: pipelineRunTableColumnClasses.snapshot, sortable: false },
  { key: 'workspace', title: 'Namespace', className: pipelineRunTableColumnClasses.workspace, sortable: false },
  { key: 'trigger', title: 'Trigger', className: pipelineRunTableColumnClasses.trigger, sortable: false },
  { key: 'reference', title: 'Reference', className: pipelineRunTableColumnClasses.reference, sortable: false },
  { key: 'kebab', title: '', className: pipelineRunTableColumnClasses.kebab, sortable: false },
] as const;

// Default column sets for different contexts
export const defaultStandardColumns: Set<PipelineRunColumnKey> = new Set([
  'name',
  'started',
  'duration',
  'status',
  'testResultStatus',
  'type',
  'component',
  'trigger',
  'reference',
  'kebab',
]);

export const defaultVulnerabilityColumns: Set<PipelineRunColumnKey> = new Set([
  'name',
  'started',
  'vulnerabilities',
  'duration',
  'status',
  'type',
  'trigger',
  'reference',
  'kebab',
]);

export const defaultReleaseColumns: Set<PipelineRunColumnKey> = new Set([
  'name',
  'started',
  'duration',
  'status',
  'type',
  'workspace',
  'snapshot',
  'kebab',
]);

export const createPipelineRunListHeader = (
  visibleColumns: Set<PipelineRunColumnKey> = defaultStandardColumns,
) => {
  return () => {
    const filteredColumns = pipelineRunColumns.filter((column) => visibleColumns.has(column.key));
    
    return filteredColumns.map((column) => {
      // Special handling for test result column with popover
      if (column.key === 'testResultStatus') {
        return {
          title: <div>Test result</div>,
          props: {
            className: column.className,
            info: {
              popover: 'The test result is the TEST_OUTPUT of the pipeline run integration test.',
            },
          },
        };
      }
      
      // Standard column handling
      return {
        title: column.title,
        props: {
          className: column.className,
        },
      };
    });
  };
};

// Legacy function for backward compatibility
const createPipelineRunListHeaderLegacy =
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
    const visibleColumns = new Set<PipelineRunColumnKey>(['name', 'started', 'duration', 'status', 'type', 'kebab']);
    
    if (showVulnerabilities) visibleColumns.add('vulnerabilities');
    if (showWorkspace) visibleColumns.add('workspace');
    if (showTestResult) visibleColumns.add('testResultStatus');
    if (showComponent) visibleColumns.add('component');
    if (showSnapshot) visibleColumns.add('snapshot');
    if (showTrigger) visibleColumns.add('trigger');
    if (showReference) visibleColumns.add('reference');
    
    return createPipelineRunListHeader(visibleColumns)();
  };

export const PipelineRunListHeader = createPipelineRunListHeaderLegacy(
  false,
  false,
  true,
  true,
  false,
  true,
  true,
);

export const PipelineRunListHeaderWithVulnerabilities = createPipelineRunListHeaderLegacy(
  true,
  false,
  false,
  false,
  false,
  true,
  true,
);

export const PipelineRunListHeaderForRelease = createPipelineRunListHeaderLegacy(
  false,
  true,
  false,
  false,
  true,
  false,
  false,
);
