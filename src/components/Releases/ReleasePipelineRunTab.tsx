import * as React from 'react';
import { useParams } from 'react-router-dom';
import { Bullseye, Spinner, Title } from '@patternfly/react-core';
import { RouterParams } from '@routes/utils';
import { FilterContext } from '~/components/Filter/generic/FilterContext';
import { BaseTextFilterToolbar } from '~/components/Filter/toolbars/BaseTextFIlterToolbar';
import { useReleasePlan } from '~/hooks/useReleasePlans';
import { useRelease } from '~/hooks/useReleases';
import { Table } from '~/shared';
import FilteredEmptyState from '~/shared/components/empty-state/FilteredEmptyState';
import ColumnManagement, { ColumnDefinition } from '~/shared/components/table/ColumnManagement';
import { useNamespace } from '~/shared/providers/Namespace';
import {
  getFinalFromRelease,
  getManagedProcessingFromRelease,
  getNamespaceAndPRName,
  getTenantCollectorProcessingFromRelease,
  getTenantProcessingFromRelease,
} from '~/utils/release-utils';
import { SESSION_STORAGE_KEYS } from '../../consts/constants';
import { useVisibleColumns } from '../../hooks/useVisibleColumns';
import ReleasePipelineListHeader from './ReleasePipelineList/ReleasePipelineListHeader';
import ReleasePipelineListRow from './ReleasePipelineList/ReleasePipelineListRow';
import ReleasesEmptyState from './ReleasesEmptyState';

interface PipelineRunProcessing {
  type: string;
  startTime: string | null;
  completionTime: string;
  snapshot: string;
  pipelineRun: string;
  prNamespace: string;
}

type ReleasePipelineRunColumnKeys =
  | 'name'
  | 'startTime'
  | 'duration'
  | 'type'
  | 'snapshot'
  | 'namespace'
  | 'status'
  | 'completionTime';

const pipelineRunColumns: readonly ColumnDefinition<ReleasePipelineRunColumnKeys>[] = [
  { key: 'name', title: 'Name', sortable: true },
  { key: 'startTime', title: 'Started', sortable: true },
  { key: 'duration', title: 'Duration', sortable: true },
  { key: 'type', title: 'Type', sortable: true },
  { key: 'snapshot', title: 'Snapshot', sortable: true },
  { key: 'namespace', title: 'Namespace', sortable: true },
  { key: 'status', title: 'Status', sortable: true },
  { key: 'completionTime', title: 'Completed', sortable: true },
];

const defaultVisibleColumns: Set<ReleasePipelineRunColumnKeys> = new Set([
  'name',
  'startTime',
  'duration',
  'type',
  'snapshot',
  'namespace',
]);
const nonHidableColumns: readonly ReleasePipelineRunColumnKeys[] = ['name'];

const createPipelineRunEntry = (
  type: string,
  processing: {
    completionTime?: string;
    pipelineRun?: string;
    startTime?: string;
    roleBinding?: string;
  },
  snapshot: string,
): PipelineRunProcessing | null => {
  if (!processing?.pipelineRun) return null;
  const [prNamespace, pipelineRun] = getNamespaceAndPRName(processing.pipelineRun);
  if (!pipelineRun || !prNamespace) return null;

  return {
    type,
    startTime: processing.startTime ?? null,
    completionTime: processing.completionTime ?? '',
    snapshot,
    pipelineRun,
    prNamespace,
  };
};

const ReleasePipelineRunTab: React.FC = () => {
  const { releaseName } = useParams<RouterParams>();
  const namespace = useNamespace();

  const { filters, setFilters, onClearFilters } = React.useContext(FilterContext);

  // Column management state
  const [visibleColumns, setVisibleColumns] = useVisibleColumns(
    SESSION_STORAGE_KEYS.RELEASE_PIPELINE_VISIBLE_COLUMNS,
    defaultVisibleColumns,
  );
  const [isColumnManagementOpen, setIsColumnManagementOpen] = React.useState(false);
  const [release, loaded] = useRelease(namespace, releaseName);

  const [releasePlan, releasePlanLoaded] = useReleasePlan(namespace, release?.spec?.releasePlan);

  if (!releasePlanLoaded || !loaded) {
    return (
      <Bullseye>
        <Spinner size="lg" />
      </Bullseye>
    );
  }

  const allRuns: PipelineRunProcessing[] = [
    createPipelineRunEntry(
      'Tenant Collector',
      getTenantCollectorProcessingFromRelease(release),
      release.spec.snapshot,
    ),
    createPipelineRunEntry(
      'Tenant',
      getTenantProcessingFromRelease(release),
      release.spec.snapshot,
    ),
    createPipelineRunEntry('Final', getFinalFromRelease(release), release.spec.snapshot),
    createPipelineRunEntry(
      'Managed',
      getManagedProcessingFromRelease(release),
      release.spec.snapshot,
    ),
  ].filter(Boolean);

  const filteredRuns = filters?.name
    ? allRuns.filter((run) =>
        run.pipelineRun.toLowerCase().includes((filters.name as string).toLowerCase()),
      )
    : allRuns;

  const EmptyMessage = () => <FilteredEmptyState onClearFilters={onClearFilters} />;

  return (
    <>
      <Title headingLevel="h3" className="pf-v5-c-title pf-v5-u-mt-lg pf-v5-u-pl-lg">
        Pipeline runs
      </Title>
      <Table
        data={filteredRuns}
        unfilteredData={allRuns}
        EmptyMsg={EmptyMessage}
        NoDataEmptyMsg={() => <ReleasesEmptyState />}
        Toolbar={
          <BaseTextFilterToolbar
            text={filters.name as string}
            label="name"
            setText={(name) => setFilters({ ...filters, name })}
            onClearFilters={onClearFilters}
            data-test="release-pipeline-runs-toolbar"
            totalColumns={pipelineRunColumns.length}
            openColumnManagement={() => setIsColumnManagementOpen(true)}
          />
        }
        aria-label="release-pipeline-runs-table"
        Header={() => ReleasePipelineListHeader({ visibleColumns })}
        Row={(props) => (
          <ReleasePipelineListRow
            obj={props.obj as PipelineRunProcessing}
            releasePlan={releasePlan}
            releaseName={releaseName}
            namespace={namespace}
            visibleColumns={visibleColumns}
          />
        )}
        loaded={releasePlanLoaded}
        getRowProps={(obj: PipelineRunProcessing) => ({
          id: obj.pipelineRun,
        })}
        virtualize
      />
      <ColumnManagement<ReleasePipelineRunColumnKeys>
        isOpen={isColumnManagementOpen}
        onClose={() => setIsColumnManagementOpen(false)}
        visibleColumns={visibleColumns}
        onVisibleColumnsChange={setVisibleColumns}
        columns={pipelineRunColumns}
        defaultVisibleColumns={defaultVisibleColumns}
        nonHidableColumns={nonHidableColumns}
        title="Manage pipeline run columns"
        description="Selected columns will be displayed in the pipeline runs table."
      />
    </>
  );
};

export default ReleasePipelineRunTab;
