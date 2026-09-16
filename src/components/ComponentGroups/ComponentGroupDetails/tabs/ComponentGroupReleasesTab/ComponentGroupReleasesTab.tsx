import React from 'react';
import { useParams } from 'react-router-dom';
import ColumnManagement from '~/components/ColumnManagement/ColumnManagement';
import ReleasesEmptyState from '~/components/Releases/ReleasesEmptyState';
import { IfFeature } from '~/feature-flags/hooks';
import { useReleasesV2 } from '~/hooks/useReleasesV2';
import { RouterParams } from '~/routes/utils';
import FilteredEmptyState from '~/shared/components/empty-state/FilteredEmptyState';
import {
  defineFilters,
  useFilterState,
  useFilteredData,
  FilterToolbar,
} from '~/shared/components/Filter';
import ListLayout from '~/shared/components/list-layout/ListLayout';
import { Table, TableContainer } from '~/shared/components/TableV2';
import { useNamespace } from '~/shared/providers/Namespace';
import { getErrorState } from '~/shared/utils/error-utils';
import { ReleaseKind } from '~/types';
import { textMatch } from '~/utils/text-filter-utils';
import { RELEASES_LIST_COLUMN_STATE_KEY, RELEASES_LIST_COLUMNS } from './releases-table-config';

const filterConfigs = defineFilters<ReleaseKind>()([
  {
    type: 'search',
    param: 'name',
    label: 'Name',
    filterFn: (item, value) => textMatch(item.metadata?.name, value),
  },
] as const);

export const ComponentGroupReleasesTab: React.FC = () => {
  const { groupName } = useParams<RouterParams>();
  const namespace = useNamespace();

  const {
    data: releases,
    isLoading,
    clusterError,
    archiveError,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useReleasesV2(namespace, groupName);

  const { clientFilterValues, clearAll } = useFilterState(filterConfigs);
  const { filteredData } = useFilteredData(filterConfigs, releases ?? [], clientFilterValues);

  if (archiveError ?? clusterError) {
    return getErrorState(archiveError ?? clusterError, !isLoading, 'releases');
  }

  return (
    <IfFeature flag="component-model">
      <ListLayout title="Releases">
        <TableContainer
          data={filteredData}
          unfilteredData={releases ?? []}
          loaded={!isLoading}
          emptyState={<FilteredEmptyState onClearFilters={clearAll} />}
          noDataState={<ReleasesEmptyState />}
          toolbar={
            <FilterToolbar configs={filterConfigs}>
              <ColumnManagement<ReleaseKind>
                columns={RELEASES_LIST_COLUMNS}
                columnStateKey={RELEASES_LIST_COLUMN_STATE_KEY}
                showColumnManagement
              />
            </FilterToolbar>
          }
        >
          <Table
            data={filteredData}
            columns={RELEASES_LIST_COLUMNS}
            getRowId={(obj) => obj.metadata?.uid ?? obj.metadata?.name ?? ''}
            aria-label="Releases"
            columnStateKey={RELEASES_LIST_COLUMN_STATE_KEY}
            hasNextPage={hasNextPage}
            isFetchingNextPage={isFetchingNextPage}
            fetchNextPage={fetchNextPage}
          />
        </TableContainer>
      </ListLayout>
    </IfFeature>
  );
};

export default ComponentGroupReleasesTab;
