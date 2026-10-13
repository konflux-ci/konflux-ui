import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { EmptyState, EmptyStateBody } from '@patternfly/react-core';
import ColumnManagement from '~/components/ColumnManagement/ColumnManagement';
import {
  plrNameSearchConfig,
  plrStatusFilterConfig,
  plrTypeFilterConfig,
} from '~/components/PipelineRunsPage/pipelineRunFilterConfigs';
import {
  plrNameColumn,
  plrStartedColumn,
  plrVulnerabilitiesColumn,
  plrDurationColumn,
  plrStatusColumn,
  plrTypeColumn,
  plrTriggerReferenceColumn,
  plrActionsColumn,
} from '~/components/PipelineRunsPage/PipelineRunsColumns';
import { PipelineRunLabel } from '~/consts/pipelinerun';
import { SnapshotLabels } from '~/consts/snapshots';
import { usePipelineRunV2, usePipelineRunsV2 } from '~/hooks/usePipelineRunsV2';
import { useSnapshot } from '~/hooks/useSnapshots';
import { HttpError } from '~/k8s/error';
import { RouterParams } from '~/routes/utils';
import ActionMenu from '~/shared/components/action-menu/ActionMenu';
import FilteredEmptyState from '~/shared/components/empty-state/FilteredEmptyState';
import {
  defineFilters,
  FilterToolbar,
  useFilteredData,
  useFilterState,
} from '~/shared/components/Filter';
import ListLayout from '~/shared/components/list-layout/ListLayout';
import { ColumnDefinition, SortDropdown, Table, TableContainer } from '~/shared/components/TableV2';
import { useNamespace } from '~/shared/providers/Namespace';
import { getErrorState } from '~/shared/utils/error-utils';
import { PipelineRunKind } from '~/types';
import { downloadYamlAction } from '~/utils/common-utils';
import { PIPELINE_RUN_TYPE_OPTIONS } from '~/utils/pipeline-run-filter-utils';
import { PLRStatus } from '~/utils/plr-status-config';

const COLUMN_STATE_KEY = 'group-snapshot-pipeline-runs';
const columns: ColumnDefinition<PipelineRunKind>[] = [
  plrNameColumn,
  plrStartedColumn,
  plrVulnerabilitiesColumn,
  plrDurationColumn,
  plrStatusColumn,
  plrTypeColumn,
  plrTriggerReferenceColumn,
  {
    ...plrActionsColumn,
    cell: ({ row }) => <ActionMenu actions={[downloadYamlAction(row.original)]} />,
  },
];
const filters = defineFilters<PipelineRunKind>()([
  plrNameSearchConfig,
  plrStatusFilterConfig,
  {
    ...plrTypeFilterConfig,
    // Both the separately fetched build and the snapshot's test runs must be filtered.
    mode: 'client',
    filterFn: (run, types) => types.includes(run.metadata.labels?.[PipelineRunLabel.PIPELINE_TYPE]),
  },
] as const);

const SnapshotPipelineRunsTabV2 = () => {
  const { groupName, snapshotName } = useParams<RouterParams>();
  const namespace = useNamespace();
  const { clientFilterValues, clearAll } = useFilterState(filters);
  const [snapshot, snapshotLoaded, snapshotError] = useSnapshot(
    groupName && snapshotName ? namespace : null,
    snapshotName,
  );
  const canFetchRuns = Boolean(
    groupName &&
    snapshotName &&
    snapshotLoaded &&
    !snapshotError &&
    snapshot?.spec.componentGroup === groupName,
  );
  const buildName = canFetchRuns
    ? snapshot.metadata.labels?.[SnapshotLabels.BUILD_PIPELINE_LABEL]
    : undefined;
  const [build, buildLoaded, buildError] = usePipelineRunV2(
    canFetchRuns ? namespace : null,
    buildName,
  );
  const [testRuns, testLoaded, testError, getNextPage, { hasNextPage, isFetchingNextPage }] =
    usePipelineRunsV2(canFetchRuns ? namespace : null, {
      selector: {
        matchLabels: {
          [PipelineRunLabel.COMPONENT_GROUP]: groupName,
          [PipelineRunLabel.SNAPSHOT]: snapshotName,
        },
      },
    });
  const pipelineRuns = useMemo(() => {
    if (!canFetchRuns) return [];
    const runs = new Map((testRuns ?? []).map((run) => [run.metadata.name, run]));
    if (buildName && build && !runs.has(build.metadata.name)) runs.set(build.metadata.name, build);
    return [...runs.values()].sort(
      (a, b) =>
        +new Date(b.metadata.creationTimestamp ?? 0) - +new Date(a.metadata.creationTimestamp ?? 0),
    );
  }, [canFetchRuns, testRuns, buildName, build]);
  const { filteredData } = useFilteredData(filters, pipelineRuns, clientFilterValues);
  const loaded = snapshotLoaded && testLoaded && (!buildName || buildLoaded);
  if (snapshotError && snapshotLoaded)
    return getErrorState(snapshotError, snapshotLoaded, 'snapshot');
  if (snapshotLoaded && snapshot && groupName && snapshot.spec.componentGroup !== groupName) {
    return getErrorState(HttpError.fromCode(404), true, 'snapshot');
  }
  if (testError && testLoaded) return getErrorState(testError, testLoaded, 'pipeline runs');
  if (buildName && buildError && buildLoaded)
    return getErrorState(buildError, buildLoaded, 'pipeline runs');

  return (
    <ListLayout title="Pipeline runs" description="Monitor pipeline runs for this snapshot.">
      <TableContainer
        data={filteredData}
        unfilteredData={pipelineRuns}
        loaded={loaded}
        emptyState={<FilteredEmptyState onClearFilters={clearAll} />}
        noDataState={
          <EmptyState titleText="No pipeline runs" headingLevel="h4">
            <EmptyStateBody>
              No pipeline runs have been created for this snapshot yet.
            </EmptyStateBody>
          </EmptyState>
        }
        toolbar={
          <FilterToolbar
            configs={filters}
            options={{ status: PLRStatus.filterOptions, type: PIPELINE_RUN_TYPE_OPTIONS }}
          >
            <SortDropdown columns={columns} columnStateKey={COLUMN_STATE_KEY} />
            <ColumnManagement
              columns={columns}
              columnStateKey={COLUMN_STATE_KEY}
              showColumnManagement
            />
          </FilterToolbar>
        }
      >
        <Table
          data={filteredData}
          columns={columns}
          getRowId={(run) => run.metadata.uid ?? run.metadata.name}
          aria-label="Pipeline runs"
          columnStateKey={COLUMN_STATE_KEY}
          hasNextPage={hasNextPage}
          isFetchingNextPage={isFetchingNextPage}
          fetchNextPage={getNextPage}
          enableSorting
        />
      </TableContainer>
    </ListLayout>
  );
};
export default SnapshotPipelineRunsTabV2;
