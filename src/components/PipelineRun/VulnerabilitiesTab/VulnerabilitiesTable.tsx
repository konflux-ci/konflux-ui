import * as React from 'react';
import {
  EmptyState,
  EmptyStateBody,
  EmptyStateVariant,
} from '@patternfly/react-core';
import { SearchIcon } from '@patternfly/react-icons/dist/esm/icons/search-icon';
import ColumnManagement from '~/components/ColumnManagement/ColumnManagement';
import FilteredEmptyState from '~/shared/components/empty-state/FilteredEmptyState';
import { useFilterState, useFilteredData, FilterToolbar } from '~/shared/components/Filter';
import { Table, TableContainer } from '~/shared/components/TableV2';
import type { RoxctlCveTableRow } from './types';
import {
  VULNERABILITIES_TABLE_COLUMN_STATE_KEY,
  VULNERABILITIES_TABLE_COLUMNS,
  vulnerabilitiesFilterConfigs,
  buildVulnerabilityFilterOptions,
} from './vulnerabilities-table-config';

type VulnerabilitiesTableProps = {
  data: RoxctlCveTableRow[];
};

export const VulnerabilitiesTable: React.FC<VulnerabilitiesTableProps> = ({ data }) => {
  const { clientFilterValues, clearAll, isFiltered } = useFilterState(
    vulnerabilitiesFilterConfigs,
  );
  const { filteredData } = useFilteredData(vulnerabilitiesFilterConfigs, data, clientFilterValues);

  const filterOptions = React.useMemo(() => buildVulnerabilityFilterOptions(data), [data]);

  return (
    <TableContainer
      data={filteredData}
      unfilteredData={data}
      loaded
      emptyState={<FilteredEmptyState onClearFilters={clearAll} />}
      noDataState={
        <EmptyState
          data-test="vulnerabilities-no-data"
          headingLevel="h4"
          icon={SearchIcon}
          titleText="No fixable vulnerabilities found"
          variant={EmptyStateVariant.full}
        >
          <EmptyStateBody>
            This scan did not find any fixable vulnerabilities.
          </EmptyStateBody>
        </EmptyState>
      }
      toolbar={
        isFiltered || data.length > 0 ? (
          <FilterToolbar configs={vulnerabilitiesFilterConfigs} options={filterOptions}>
            <ColumnManagement<RoxctlCveTableRow>
              columns={VULNERABILITIES_TABLE_COLUMNS}
              columnStateKey={VULNERABILITIES_TABLE_COLUMN_STATE_KEY}
              showColumnManagement
            />
          </FilterToolbar>
        ) : undefined
      }
    >
      <Table
        data={filteredData}
        columns={VULNERABILITIES_TABLE_COLUMNS}
        getRowId={(row) => row.cve}
        aria-label="Vulnerabilities"
        columnStateKey={VULNERABILITIES_TABLE_COLUMN_STATE_KEY}
        data-test="vulnerabilities-table"
      />
    </TableContainer>
  );
};
