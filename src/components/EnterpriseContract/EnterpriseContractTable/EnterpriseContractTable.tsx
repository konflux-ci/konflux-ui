import * as React from 'react';
import { Table, Th, Thead, ThProps, Tr } from '@patternfly/react-table';
import { VirtualBody } from '~/shared';
import { ENTERPRISE_CONTRACT_STATUS, UIEnterpriseContractData } from '../types';
import { WrappedEnterpriseContractRow } from './EnterpriseContractRow';

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

export const EnterpriseContractTable: React.FC<
  React.PropsWithChildren<EnterpriseContractTableProps>
> = ({ ecResult }) => {
  const [activeSortIndex, setActiveSortIndex] = React.useState<number | null>(2);
  const [activeSortDirection, setActiveSortDirection] = React.useState<'asc' | 'desc' | null>(
    'asc',
  );

  const sortedECResult = React.useMemo(() => {
    return ecResult
      ? ecResult.sort(getSortColumnFuntion(COLUMN_ORDER[activeSortIndex], activeSortDirection))
      : undefined;
  }, [activeSortDirection, activeSortIndex, ecResult]);

  const getSortParams = (columnIndex: number): ThProps['sort'] => ({
    sortBy: {
      index: activeSortIndex,
      direction: activeSortDirection,
    },
    onSort: (_event, index, direction) => {
      setActiveSortIndex(index);
      setActiveSortDirection(direction);
    },
    columnIndex,
  });

  const columns = [
    { title: '', width: 10 as const }, // Expand column
    { title: 'Rules', width: 30 as const, sort: getSortParams(1) },
    { title: 'Status', width: 10 as const, sort: getSortParams(2) },
    { title: 'Message', width: 30 as const },
    { title: 'Component', width: 20 as const, sort: getSortParams(4) },
  ];

  return sortedECResult ? (
    <Table variant="compact" aria-label="ec table">
      <Thead>
        <Tr>
          {columns.map((column, index) => (
            <Th key={index} width={column.width} sort={column.sort} aria-label={column.title}>
              {column.title}
            </Th>
          ))}
        </Tr>
      </Thead>
      <VirtualBody
        data={sortedECResult}
        columns={columns}
        Row={({ obj }) => {
          return (
            <WrappedEnterpriseContractRow
              obj={obj as UIEnterpriseContractData}
              customData={{ sortedECResult }}
            />
          );
        }}
        height={400}
        isScrolling={false}
        onChildScroll={() => {}}
        scrollTop={0}
        width={400}
        expand={false}
      />
    </Table>
  ) : null;
};
