import ColumnManagement from '~/components/ColumnManagement/ColumnManagement';
import ReleasesEmptyState from '~/components/Releases/ReleasesEmptyState';
import { IfFeature } from '~/feature-flags/hooks';
import { useReleases } from '~/hooks/useReleases';
import FilteredEmptyState from '~/shared/components/empty-state/FilteredEmptyState';
import {
  defineFilters,
  FilterToolbar,
  useFilteredData,
  useFilterState,
} from '~/shared/components/Filter';
import ListLayout from '~/shared/components/list-layout/ListLayout';
import { Table, TableContainer } from '~/shared/components/TableV2';
import { useNamespace } from '~/shared/providers/Namespace';
import { getErrorState } from '~/shared/utils/error-utils';
import { ReleaseKind } from '~/types';
import { MatchLabels } from '~/types/k8s';
import { textMatch } from '~/utils/text-filter-utils';
import { RELEASES_LIST_COLUMN_STATE_KEY, RELEASES_LIST_COLUMNS } from './releases-table-config';

type ReleasesPageProps = {
  selectorMatchLabels: MatchLabels | undefined;
};

const filterConfigs = defineFilters<ReleaseKind>()([
  {
    type: 'search',
    param: 'name',
    label: 'Name',
    filterFn: (item, value) => textMatch(item.metadata?.name, value),
  },
] as const);

export const ReleasesPage: React.FC<ReleasesPageProps> = ({ selectorMatchLabels }) => {
  const namespace = useNamespace();

  const {
    data: releases,
    isLoading,
    clusterError,
    archiveError,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useReleases(namespace, selectorMatchLabels);

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

export default ReleasesPage;
