import { useMemo } from 'react';
import { PageSection } from '@patternfly/react-core';
import PageLayout from '~/components/PageLayout/PageLayout';
import { FeatureFlagIndicator } from '~/feature-flags/FeatureFlagIndicator';
import { useComponentGroups } from '~/hooks/useComponentGroups';
import FilteredEmptyState from '~/shared/components/empty-state/FilteredEmptyState';
import { FilterToolbar, useFilteredData, useFilterState } from '~/shared/components/Filter';
import { Table, TableContainer } from '~/shared/components/TableV2';
import { useNamespace } from '~/shared/providers/Namespace';
import { getErrorState } from '~/shared/utils/error-utils';
import {
  componentGroupsFilterConfig,
  getComponentGroupsTableColumns,
} from './component-groups-table-config';
import ComponentGroupsEmptyState from './ComponentGroupsEmptyState';

export const ComponentGroupsListView: React.FC = () => {
  const namespace = useNamespace();
  const [groups, loaded, error] = useComponentGroups(namespace, true);
  const columns = useMemo(() => getComponentGroupsTableColumns(namespace), [namespace]);
  const { clientFilterValues, clearAll, isFiltered } = useFilterState(componentGroupsFilterConfig);

  const { filteredData } = useFilteredData(componentGroupsFilterConfig, groups, clientFilterValues);

  if (error) {
    return getErrorState(error, loaded, 'component groups');
  }

  return (
    <PageLayout
      title={
        <>
          Groups
          <FeatureFlagIndicator flags={['component-model'] as const} />
        </>
      }
      description="One or more components or its branches can be grouped to form a component group"
    >
      <PageSection>
        <TableContainer
          data={filteredData}
          unfilteredData={groups}
          loaded={loaded}
          emptyState={<FilteredEmptyState onClearFilters={clearAll} />}
          noDataState={<ComponentGroupsEmptyState />}
          toolbar={
            isFiltered || groups.length > 0 ? (
              <FilterToolbar configs={componentGroupsFilterConfig} />
            ) : undefined
          }
        >
          <Table
            data={filteredData}
            columns={columns}
            getRowId={(row) => row.metadata?.name ?? '-'}
            aria-label="Component groups list"
            enableSorting
          />
        </TableContainer>
      </PageSection>
    </PageLayout>
  );
};
