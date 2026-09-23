import * as React from 'react';
import { PageSection } from '@patternfly/react-core';
import {
  componentsFilterConfig,
  componentsTableColumns,
} from '~/components/ComponentList/component-table-config';
import { ComponentsListEmptyState } from '~/components/ComponentList/ComponentsListEmptyState';
import PageLayout from '~/components/PageLayout/PageLayout';
import { useAllComponents } from '~/hooks/useComponents';
import FilteredEmptyState from '~/shared/components/empty-state/FilteredEmptyState';
import { FilterToolbar, useFilteredData, useFilterState } from '~/shared/components/Filter';
import { Table, TableContainer } from '~/shared/components/TableV2';
import { useNamespace } from '~/shared/providers/Namespace';
import { getErrorState } from '~/shared/utils/error-utils';

const ComponentsListView: React.FC = () => {
  const namespace = useNamespace();
  const { clientFilterValues, clearAll, isFiltered } = useFilterState(componentsFilterConfig);

  const [components, compLoaded, compError] = useAllComponents(namespace);

  const { filteredData } = useFilteredData(componentsFilterConfig, components, clientFilterValues);

  if (compError) {
    return getErrorState(compError, compLoaded, 'components');
  }

  return (
    <PageLayout
      title="Components"
      description="A component is an image built from source code in a repository."
    >
      <PageSection>
        <TableContainer
          data={filteredData}
          unfilteredData={components}
          loaded={compLoaded}
          emptyState={<FilteredEmptyState onClearFilters={clearAll} />}
          noDataState={<ComponentsListEmptyState />}
          toolbar={
            isFiltered || components.length > 0 ? (
              <FilterToolbar configs={componentsFilterConfig} />
            ) : undefined
          }
        >
          <Table
            data={filteredData}
            columns={componentsTableColumns}
            getRowId={(row) => row.metadata.name}
            aria-label="Component list"
            enableSorting
          />
        </TableContainer>
      </PageSection>
    </PageLayout>
  );
};

export default ComponentsListView;
