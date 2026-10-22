import React, { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { Button, EmptyState, EmptyStateBody } from '@patternfly/react-core';
import ColumnManagement from '~/components/ColumnManagement/ColumnManagement';
import {
  plrNameSearchConfig,
  plrStatusFilterConfig,
  plrTypeFilterConfig,
  plrEventTypeFilterConfig,
} from '~/components/PipelineRunsPage/pipelineRunFilterConfigs';
import { pipelineRunsColumns } from '~/components/PipelineRunsPage/PipelineRunsColumns';
import { PipelineRunLabel } from '~/consts/pipelinerun';
import { IfFeature } from '~/feature-flags/hooks';
import { useComponentGroup } from '~/hooks/useComponentGroups';
import { usePipelineRunsV2 } from '~/hooks/usePipelineRunsV2';
import { RouterParams } from '~/routes/utils';
import FilteredEmptyState from '~/shared/components/empty-state/FilteredEmptyState';
import {
  defineFilters,
  useFilterState,
  useFilteredData,
  FilterToolbar,
} from '~/shared/components/Filter';
import ListLayout from '~/shared/components/list-layout/ListLayout';
import { Table, TableContainer, SortDropdown } from '~/shared/components/TableV2';
import { useNamespace } from '~/shared/providers/Namespace';
import { getErrorState } from '~/shared/utils/error-utils';
import { PipelineRunKind } from '~/types';
import {
  filterPipelineRunsByComponentVersions,
  getComponentGroupVersionMap,
} from '~/utils/component-group-utils';
import {
  PIPELINE_RUN_TYPE_OPTIONS,
  PIPELINE_RUN_EVENT_TYPE_OPTIONS,
} from '~/utils/pipeline-run-filter-utils';
import { PLRStatus } from '~/utils/plr-status-config';

const COLUMN_STATE_KEY = 'component-group-pipeline-runs';
const filterConfigs = defineFilters<PipelineRunKind>()([
  plrNameSearchConfig,
  plrStatusFilterConfig,
  plrTypeFilterConfig,
  plrEventTypeFilterConfig,
] as const);

export const ComponentGroupPipelineRunsTab: React.FC = () => {
  const { groupName } = useParams<RouterParams>();
  const namespace = useNamespace();
  const [group, groupLoaded, groupError] = useComponentGroup(namespace, groupName, true);
  const componentVersions = useMemo(
    () => getComponentGroupVersionMap(group?.spec.components ?? []),
    [group?.spec.components],
  );
  const { filterValues, clientFilterValues, clearAll, isFiltered } = useFilterState(filterConfigs);
  const matchExpressions = [
    { key: PipelineRunLabel.COMPONENT, values: [...componentVersions.keys()] },
    {
      key: PipelineRunLabel.COMPONENT_VERSION,
      values: [...new Set([...componentVersions.values()].flatMap((versions) => [...versions]))],
    },
    { key: PipelineRunLabel.PIPELINE_TYPE, values: filterValues.type },
    { key: PipelineRunLabel.COMMIT_EVENT_TYPE_LABEL, values: filterValues.eventType },
  ]
    .filter(({ values }) => values?.length > 0)
    .map(({ key, values }) => ({ key, operator: 'In', values }));

  const queryEnabled = !!groupName && groupLoaded && !groupError && componentVersions.size > 0;
  const [fetchedRuns, runsLoaded, error, getNextPage, { hasNextPage, isFetchingNextPage }] =
    usePipelineRunsV2(queryEnabled ? namespace : null, {
      selector: {
        matchExpressions,
      },
    });
  const pipelineRuns = useMemo(
    () => filterPipelineRunsByComponentVersions(fetchedRuns, componentVersions),
    [fetchedRuns, componentVersions],
  );
  const loaded = groupLoaded && (!queryEnabled || runsLoaded);
  const { filteredData } = useFilteredData(filterConfigs, pipelineRuns, clientFilterValues);

  if (groupLoaded && (groupError || !group)) {
    return getErrorState(groupError ?? { code: 404 }, groupLoaded, 'component group');
  }

  if (error && loaded) {
    return getErrorState(error, loaded, 'pipeline runs');
  }

  return (
    <IfFeature flag="component-model">
      <ListLayout
        title="Pipeline runs"
        description="Monitor pipeline runs for this component group."
      >
        <TableContainer
          data={filteredData}
          unfilteredData={pipelineRuns}
          loaded={loaded}
          emptyState={<FilteredEmptyState onClearFilters={clearAll} />}
          noDataState={
            isFiltered ? (
              <FilteredEmptyState onClearFilters={clearAll} />
            ) : (
              <EmptyState titleText="No pipeline runs" headingLevel="h4">
                <EmptyStateBody>
                  No pipeline runs have been created for this component group yet.
                </EmptyStateBody>
              </EmptyState>
            )
          }
          toolbar={
            <FilterToolbar
              configs={filterConfigs}
              options={{
                status: PLRStatus.filterOptions,
                type: PIPELINE_RUN_TYPE_OPTIONS,
                eventType: PIPELINE_RUN_EVENT_TYPE_OPTIONS,
              }}
            >
              <SortDropdown columns={pipelineRunsColumns} columnStateKey={COLUMN_STATE_KEY} />
              <ColumnManagement
                columns={pipelineRunsColumns}
                columnStateKey={COLUMN_STATE_KEY}
                showColumnManagement
              />
            </FilterToolbar>
          }
        >
          <Table
            data={filteredData}
            columns={pipelineRunsColumns}
            getRowId={(row) => row.metadata?.uid ?? row.metadata?.name ?? ''}
            aria-label="Pipeline runs"
            columnStateKey={COLUMN_STATE_KEY}
            hasNextPage={hasNextPage}
            isFetchingNextPage={isFetchingNextPage}
            fetchNextPage={getNextPage}
            enableSorting
          />
        </TableContainer>
        {loaded && hasNextPage && (
          <Button
            variant="link"
            onClick={() => void getNextPage?.()}
            isDisabled={isFetchingNextPage}
            isLoading={isFetchingNextPage}
          >
            Load more pipeline runs
          </Button>
        )}
      </ListLayout>
    </IfFeature>
  );
};

export default ComponentGroupPipelineRunsTab;
