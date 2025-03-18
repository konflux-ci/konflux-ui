import * as React from 'react';
import { Pagination } from '@patternfly/react-core';
import { Table /* data-codemods */, Th, Thead, ThProps, Tr } from '@patternfly/react-table';
import { ENTERPRISE_CONTRACT_STATUS, UIEnterpriseContractData } from '../types';
import { EnterpriseContractRow } from './EnterpriseContractRow';

type EnterpriseContractTableProps = {
  ecResult: UIEnterpriseContractData[];
};

const STATUS_SORT_ORDER = [
  ENTERPRISE_CONTRACT_STATUS.violations,
  ENTERPRISE_CONTRACT_STATUS.warnings,
  ENTERPRISE_CONTRACT_STATUS.successes,
];
const COLUMN_ORDER = [undefined, 'title', 'status', 'msg', 'component'];

export const getSortColumnFuntion = (key: string, activeSortDirection: string) => {
  switch (key) {
    case 'status':
      return (a: UIEnterpriseContractData, b: UIEnterpriseContractData) => {
        const aValue = STATUS_SORT_ORDER.indexOf(a[key]);
        const bValue = STATUS_SORT_ORDER.indexOf(b[key]);
        if (aValue < bValue) {
          return activeSortDirection === 'asc' ? -1 : 1;
        } else if (aValue > bValue) {
          return activeSortDirection === 'asc' ? 1 : -1;
        }
        return 0;
      };

    default:
      return (a: UIEnterpriseContractData, b: UIEnterpriseContractData) => {
        const aValue = a[key];
        const bValue = b[key];
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          // String sort
          if (activeSortDirection === 'asc') {
            return aValue.localeCompare(bValue);
          }
          return bValue.localeCompare(aValue);
        }
      };
  }
};

// Add Reat.memo to avoid unexpected redender when the ecResult has no change.
export const EnterpriseContractTable: React.FC<
  React.PropsWithChildren<EnterpriseContractTableProps>
> = React.memo(({ ecResult }) => {
  const [activeSortIndex, setActiveSortIndex] = React.useState<number | null>(2);
  const [activeSortDirection, setActiveSortDirection] = React.useState<'asc' | 'desc' | null>(
    'asc',
  );
  // We add pagination support here to avoid large ecResult.
  // When one application has more than 100 components, the size of ecResult is more than
  // 23M and the length of records is more than 50000. The browser cannot show it in one page.
  // More, we cannot enjoy the shared virtualized table for inconsisitent parameters.
  const [currentPage, setCurrentPage] = React.useState(1);
  const [rowsPerPage, setRowsPerPage] = React.useState(10);

  const sortedECResult = React.useMemo(() => {
    // [...ecResult] would fix the order problem
    return ecResult
      ? [...ecResult].sort(getSortColumnFuntion(COLUMN_ORDER[activeSortIndex], activeSortDirection))
      : undefined;
  }, [activeSortDirection, activeSortIndex, ecResult]);

  const currentData = React.useMemo(() => {
    if (sortedECResult) {
      const startIndex = (currentPage - 1) * rowsPerPage;
      const endIndex = startIndex + rowsPerPage;
      return sortedECResult.slice(startIndex, endIndex);
    }
    return [];
  }, [currentPage, rowsPerPage, sortedECResult]);

  const onSetPage = React.useCallback(
    (_event: React.MouseEvent | React.KeyboardEvent | MouseEvent, newPage: number) => {
      setCurrentPage(newPage);
    },
    [],
  );

  const onPerPageSelect = React.useCallback(
    (
      _event: React.MouseEvent | React.KeyboardEvent | MouseEvent,
      newPerPage: number,
      newPage: number,
    ) => {
      setRowsPerPage(newPerPage);
      setCurrentPage(newPage);
    },
    [],
  );

  const getSortParams = (columnIndex: number): ThProps['sort'] => ({
    sortBy: {
      index: activeSortIndex,
      direction: activeSortDirection,
    },
    onSort: (_event, index, direction) => {
      setActiveSortIndex(index);
      setActiveSortDirection(direction);
      setCurrentPage(1);
    },
    columnIndex,
  });
  // We add aria-label to th to avoid console warn
  return sortedECResult ? (
    <>
      <Table variant="compact" aria-label="ec table">
        <Thead>
          <Tr>
            <Th width={10} aria-label="expand toggle" />
            <Th width={30} sort={getSortParams(1)} aria-label="ec rules filter">
              Rules
            </Th>
            <Th width={10} sort={getSortParams(2)} aria-label="ec status filter">
              Status
            </Th>
            <Th width={30} aria-label="ec message column">
              Message
            </Th>
            <Th width={20} sort={getSortParams(4)} aria-label="ec component filter">
              Component
            </Th>
          </Tr>
        </Thead>
        {currentData.map((rule, i) => {
          return <EnterpriseContractRow rowIndex={i} key={i} data={rule} />;
        })}
      </Table>

      <Pagination
        itemCount={sortedECResult.length}
        perPage={rowsPerPage}
        page={currentPage}
        onSetPage={onSetPage}
        onPerPageSelect={onPerPageSelect}
      />
    </>
  ) : null;
});
