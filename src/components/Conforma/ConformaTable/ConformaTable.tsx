import * as React from 'react';
import { SortByDirection } from '@patternfly/react-table';
import { ChatContextTarget, withChatContextRowProps } from '~/components/AIChat';
import { Table } from '~/shared';
import { CONFORMA_RESULT_STATUS, UIConformaData } from '~/types/conforma';
import { getConformaRuleRowContext } from '../conforma-chat-context';
import { ConformaExpandedRowContent } from './ConformaExpandedRowContent';
import getConformaHeader from './ConformaHeader';
import { WrappedConformaRow } from './ConformaRow';
import './ConformaTable.scss';

type ConformaTableProps = {
  conformaResult: UIConformaData[];
};

const STATUS_SORT_ORDER = [
  CONFORMA_RESULT_STATUS.violations,
  CONFORMA_RESULT_STATUS.warnings,
  CONFORMA_RESULT_STATUS.successes,
];
const COLUMN_ORDER = [undefined, 'title', 'status', 'msg', 'component'];

export const getSortColumnFuntion = (key: string, activeSortDirection: string) => {
  switch (key) {
    case 'status':
      return (a: UIConformaData, b: UIConformaData) => {
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
      return (a: UIConformaData, b: UIConformaData) => {
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

export const ConformaTable: React.FC<React.PropsWithChildren<ConformaTableProps>> = ({
  conformaResult: crResult,
}) => {
  const [activeSortIndex, setActiveSortIndex] = React.useState<number | null>(2);
  const [activeSortDirection, setActiveSortDirection] = React.useState<
    SortByDirection.asc | SortByDirection.desc | null
  >(SortByDirection.asc);

  const ConformaHeader = React.useMemo(
    () =>
      getConformaHeader(activeSortIndex, activeSortDirection, (_, index, direction) => {
        setActiveSortIndex(index);
        setActiveSortDirection(direction);
      }),
    [activeSortDirection, activeSortIndex],
  );

  const sortedCRResult = React.useMemo(() => {
    return crResult
      ? [...crResult].sort(getSortColumnFuntion(COLUMN_ORDER[activeSortIndex], activeSortDirection))
      : undefined;
  }, [activeSortDirection, activeSortIndex, crResult]);

  return sortedCRResult ? (
    <ChatContextTarget
      id="conforma-results-table"
      label="Conforma results table"
      description="Security policy validation results"
    >
      <div className="pf-v5-c-table pf-m-compact pf-m-grid-md">
        <Table
          virtualize
          data={sortedCRResult}
          aria-label="conforma-table"
          Header={ConformaHeader}
          ExpandedContent={(props) => {
            const obj = props.obj as UIConformaData;
            return <ConformaExpandedRowContent {...props} obj={obj} />;
          }}
          Row={(props) => {
            const obj = props.obj as UIConformaData;

            return (
              <WrappedConformaRow
                {...props}
                obj={obj}
                customData={{ sortedConformaResult: sortedCRResult }}
              />
            );
          }}
          loaded
          customData={{ sortedCRResult }}
          expand
          getRowProps={(obj: UIConformaData) => {
            const rowContext = getConformaRuleRowContext(obj);
            return withChatContextRowProps(
              { id: `${obj.component}-${obj.title}` },
              rowContext,
            );
          }}
        />
      </div>
    </ChatContextTarget>
  ) : null;
};
