import * as React from 'react';
import { EmptyState, EmptyStateBody, EmptyStateVariant } from '@patternfly/react-core';
import { SearchIcon } from '@patternfly/react-icons/dist/esm/icons/search-icon';
import type { ExpandedState, OnChangeFn } from '@tanstack/react-table';
import ColumnManagement from '~/components/ColumnManagement/ColumnManagement';
import { VulnerabilitiesExpandedRow } from '~/components/PipelineRun/VulnerabilitiesTab/VulnerabilitiesExpandedRow';
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
  const [expanded, setExpanded] = React.useState<ExpandedState>({});
  const { clientFilterValues, clearAll, isFiltered } = useFilterState(vulnerabilitiesFilterConfigs);
  const { filteredData } = useFilteredData<RoxctlCveTableRow>(
    vulnerabilitiesFilterConfigs,
    data,
    clientFilterValues,
  );
  const tableData = React.useMemo(() => {
    const selectedPackages = clientFilterValues.package;
    if (selectedPackages.length === 0) return filteredData;

    return filteredData.map((row) => ({
      ...row,
      components: row.components.filter((component) => selectedPackages.includes(component.name)),
    }));
  }, [clientFilterValues.package, filteredData]);

  const filterOptions = React.useMemo(() => buildVulnerabilityFilterOptions(data), [data]);
  const rowsByCve = React.useMemo(() => new Map(data.map((row) => [row.cve, row])), [data]);
  const handleExpandedChange = React.useCallback<OnChangeFn<ExpandedState>>((updater) => {
    setExpanded((current) => {
      const next = typeof updater === 'function' ? updater(current) : updater;
      if (next === true) return {};

      const newlyExpandedRow = Object.keys(next).find(
        (rowId) => next[rowId] && (current === true || !current[rowId]),
      );
      return newlyExpandedRow ? { [newlyExpandedRow]: true } : {};
    });
  }, []);
  const renderExpandedContent = React.useCallback(
    (row: RoxctlCveTableRow) => (
      <VulnerabilitiesExpandedRow vulnerability={rowsByCve.get(row.cve) ?? row} />
    ),
    [rowsByCve],
  );

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
          <EmptyStateBody>This scan did not find any fixable vulnerabilities.</EmptyStateBody>
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
        data={tableData}
        columns={VULNERABILITIES_TABLE_COLUMNS}
        getRowId={(row) => row.cve}
        aria-label="Vulnerabilities"
        columnStateKey={VULNERABILITIES_TABLE_COLUMN_STATE_KEY}
        data-test="vulnerabilities-table"
        enableExpansion
        expanded={expanded}
        onExpandedChange={handleExpandedChange}
        expandedContent={renderExpandedContent}
      />
    </TableContainer>
  );
};
