import * as React from 'react';
import { SortByDirection } from '@patternfly/react-table';
import { Table } from '~/shared';
import { ENTERPRISE_CONTRACT_STATUS, UIEnterpriseContractData } from '../types';
import { EnterpriseContractExpandedRowContent } from './EnterpriseContractExpandedRowContent';
import getEnterpriseContractHeader from './EnterpriseContractHeader';
import { WrappedEnterpriseContractRow } from './EnterpriseContractRow';
import './EnterpriceContractTable.scss';

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
  const [activeSortDirection, setActiveSortDirection] = React.useState<
    SortByDirection.asc | SortByDirection.desc | null
  >(SortByDirection.asc);

  const EnterpriseContractHeader = React.useMemo(
    () =>
      getEnterpriseContractHeader(activeSortIndex, activeSortDirection, (_, index, direction) => {
        setActiveSortIndex(index);
        setActiveSortDirection(direction);
      }),
    [activeSortDirection, activeSortIndex],
  );

  const sortedECResult = React.useMemo(() => {
    return ecResult
      ? ecResult.sort(getSortColumnFuntion(COLUMN_ORDER[activeSortIndex], activeSortDirection))
      : undefined;
  }, [activeSortDirection, activeSortIndex, ecResult]);

  // We have to add the expand control here to ensure it works for every row.
  // const [expandedRowIndex, setExpandedRowIndex] = React.useState<number | null>(null);

  const [expandedRowIndexes, setExpandedRowIndexes] = React.useState<Set<number>>(new Set());

  const toggleRow = (index: number) => {
    setExpandedRowIndexes((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  return sortedECResult ? (
    <div className="pf-v5-c-table pf-m-compact pf-m-grid-md">
      <Table
        virtualize
        data={sortedECResult}
        aria-label="ec table"
        Header={EnterpriseContractHeader}
        expandedRowIndexes={expandedRowIndexes}
        ExpandedContent={(props) => {
          const obj = props.obj as UIEnterpriseContractData;
          const rowIndex = sortedECResult.findIndex((r) => r === obj);
          const isExpanded = expandedRowIndexes.has(rowIndex);
          return isExpanded ? (
            <EnterpriseContractExpandedRowContent {...props} obj={obj} isExpanded={isExpanded} />
          ) : null;
        }}
        Row={(props) => {
          const obj = props.obj as UIEnterpriseContractData;
          const rowIndex = sortedECResult.findIndex((r) => r === obj);
          const isExpanded = expandedRowIndexes.has(rowIndex);

          return (
            <WrappedEnterpriseContractRow
              {...props}
              obj={obj}
              isExpanded={isExpanded}
              onToggleExpand={() => toggleRow(rowIndex)}
              customData={{ sortedECResult }}
            />
          );
        }}
        loaded
        customData={{ sortedECResult }}
        expand={true}
      />
    </div>
  ) : null;
};
