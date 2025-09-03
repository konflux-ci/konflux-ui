import { SortByDirection, ThProps } from '@patternfly/react-table';
import { createTableHeaders } from '~/shared/components/table/utils';
import {
  CommitColumnKeys,
  commitsColumns,
  commitsTableColumnClasses,
  COMMIT_COLUMN_ORDER,
  getDynamicCommitsColumnClasses,
} from './commits-columns-config';

interface CommitsListHeaderProps {
  visibleColumns: Set<CommitColumnKeys>;
}

const getCommitsListHeader = (
  activeSortIndex?: number,
  activeSortDirection?: SortByDirection,
  onSort?: ThProps['sort']['onSort'],
  visibleColumns?: Set<CommitColumnKeys>,
) => {
  const columnsToUse = visibleColumns || new Set(COMMIT_COLUMN_ORDER);
  const dynamicClasses = getDynamicCommitsColumnClasses(columnsToUse);

  const columnConfigs = COMMIT_COLUMN_ORDER.filter((col) => columnsToUse.has(col)).map((col) => {
    const idx = COMMIT_COLUMN_ORDER.indexOf(col);
    const originalColumn = commitsColumns[idx];
    return {
      ...originalColumn,
      className: dynamicClasses[col] ?? originalColumn.className,
    };
  });

  const finalColumns = [
    ...columnConfigs,
    {
      title: ' ',
      className: dynamicClasses.kebab,
    },
  ];

  return createTableHeaders(finalColumns)(activeSortIndex, activeSortDirection, onSort);
};

const getCommitsListHeaderWithColumns = (
  visibleColumns: Set<CommitColumnKeys>,
  activeSortIndex?: number,
  activeSortDirection?: SortByDirection,
  onSort?: ThProps['sort']['onSort'],
) => {
  return getCommitsListHeader(activeSortIndex, activeSortDirection, onSort, visibleColumns);
};

const CommitsListHeader = ({ visibleColumns }: CommitsListHeaderProps) => {
  return getCommitsListHeaderWithColumns(visibleColumns);
};

export { getCommitsListHeader, getCommitsListHeaderWithColumns, commitsTableColumnClasses };
export default CommitsListHeader;
