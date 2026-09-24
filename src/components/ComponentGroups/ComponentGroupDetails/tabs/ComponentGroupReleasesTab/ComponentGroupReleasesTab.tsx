import React from 'react';
import { useParams } from 'react-router-dom';
import ColumnManagement from '~/components/ColumnManagement/ColumnManagement';
import {
  COMPONENT_GROUP_RELEASES_LIST_COLUMN_STATE_KEY,
  RELEASES_LIST_COLUMNS,
  RELEASES_LIST_FILTERS,
} from '~/components/Release/releases-table-config';
import ReleasesEmptyState from '~/components/Releases/ReleasesEmptyState';
import { IfFeature } from '~/feature-flags/hooks';
import { useReleases } from '~/hooks/useReleases';
import { RouterParams } from '~/routes/utils';
import FilteredEmptyState from '~/shared/components/empty-state/FilteredEmptyState';
import { FilterToolbar, useFilteredData, useFilterState } from '~/shared/components/Filter';
import ListLayout from '~/shared/components/list-layout/ListLayout';
import { Table, TableContainer } from '~/shared/components/TableV2';
import { useNamespace } from '~/shared/providers/Namespace';
import { getErrorState } from '~/shared/utils/error-utils';
import { ReleaseKind } from '~/types';
import { getGroupNameMatchLabels } from '~/utils/release-utils';

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
  } = useReleases(namespace, getGroupNameMatchLabels(groupName));

  const { clientFilterValues, clearAll } = useFilterState(RELEASES_LIST_FILTERS);
  const { filteredData } = useFilteredData(
    RELEASES_LIST_FILTERS,
    releases ?? [],
    clientFilterValues,
  );

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
            <FilterToolbar configs={RELEASES_LIST_FILTERS}>
              <ColumnManagement<ReleaseKind>
                columns={RELEASES_LIST_COLUMNS}
                columnStateKey={COMPONENT_GROUP_RELEASES_LIST_COLUMN_STATE_KEY}
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
            columnStateKey={COMPONENT_GROUP_RELEASES_LIST_COLUMN_STATE_KEY}
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
