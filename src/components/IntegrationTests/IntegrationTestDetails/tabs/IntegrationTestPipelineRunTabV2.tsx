import React from 'react';
import { useParams } from 'react-router-dom';
import { EmptyState, EmptyStateBody } from '@patternfly/react-core';
import ColumnManagement from '~/components/ColumnManagement/ColumnManagement';
import { IntegrationTestLabels } from '~/components/IntegrationTests/IntegrationTestForm/types';
import {
  plrNameSearchConfig,
  plrStatusFilterConfig,
  plrEventTypeFilterConfig,
} from '~/components/PipelineRunsPage/pipelineRunFilterConfigs';
import {
  plrNameColumn,
  plrStartedColumn,
  plrDurationColumn,
  plrStatusColumn,
  plrTestOutputColumn,
  plrTypeColumn,
  plrComponentColumn,
  plrTriggerReferenceColumn,
  plrActionsColumn,
} from '~/components/PipelineRunsPage/PipelineRunsColumns';
import { PipelineRunLabel } from '~/consts/pipelinerun';
import { IfFeature } from '~/feature-flags/hooks';
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
import { PIPELINE_RUN_EVENT_TYPE_OPTIONS } from '~/utils/pipeline-run-filter-utils';
import { PLRStatus } from '~/utils/plr-status-config';

const COLUMN_STATE_KEY = 'group-integration-test-pipeline-runs';
const integrationTestColumns = [
  plrNameColumn,
  plrStartedColumn,
  plrDurationColumn,
  plrStatusColumn,
  plrTestOutputColumn,
  plrTypeColumn,
  plrComponentColumn,
  plrTriggerReferenceColumn,
  plrActionsColumn,
];
const filterConfigs = defineFilters<PipelineRunKind>()([
  plrNameSearchConfig,
  plrStatusFilterConfig,
  plrEventTypeFilterConfig,
] as const);

const IntegrationTestPipelineRunTabV2: React.FC = () => {
  const { groupName, integrationTestName } = useParams<RouterParams>();
  const namespace = useNamespace();
  const { filterValues, clientFilterValues, clearAll, isFiltered } = useFilterState(filterConfigs);
  const matchExpressions = [
    { key: PipelineRunLabel.COMMIT_EVENT_TYPE_LABEL, values: filterValues.eventType },
  ]
    .filter(({ values }) => values?.length > 0)
    .map(({ key, values }) => ({ key, operator: 'In', values }));

  const [pipelineRuns, loaded, error, getNextPage, { hasNextPage, isFetchingNextPage }] =
    usePipelineRunsV2(groupName && integrationTestName ? namespace : null, {
      selector: {
        matchLabels: {
          [PipelineRunLabel.COMPONENT_GROUP]: groupName,
          [IntegrationTestLabels.SCENARIO]: integrationTestName,
        },
        matchExpressions,
      },
    });
  const { filteredData } = useFilteredData(filterConfigs, pipelineRuns, clientFilterValues);

  if (error && loaded) {
    return getErrorState(error, loaded, 'pipeline runs');
  }

  return (
    <IfFeature flag="component-model">
      <ListLayout
        title="Pipeline runs"
        description="Monitor pipeline runs for this integration test."
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
                  No pipeline runs have been created for this integration test yet.
                </EmptyStateBody>
              </EmptyState>
            )
          }
          toolbar={
            <FilterToolbar
              configs={filterConfigs}
              options={{
                status: PLRStatus.filterOptions,
                eventType: PIPELINE_RUN_EVENT_TYPE_OPTIONS,
              }}
            >
              <SortDropdown columns={integrationTestColumns} columnStateKey={COLUMN_STATE_KEY} />
              <ColumnManagement
                columns={integrationTestColumns}
                columnStateKey={COLUMN_STATE_KEY}
                showColumnManagement
              />
            </FilterToolbar>
          }
        >
          <Table
            data={filteredData}
            columns={integrationTestColumns}
            getRowId={(row) => row.metadata?.uid ?? row.metadata?.name ?? ''}
            aria-label="Pipeline runs"
            columnStateKey={COLUMN_STATE_KEY}
            hasNextPage={hasNextPage}
            isFetchingNextPage={isFetchingNextPage}
            fetchNextPage={getNextPage}
            enableSorting
          />
        </TableContainer>
      </ListLayout>
    </IfFeature>
  );
};

export default IntegrationTestPipelineRunTabV2;
