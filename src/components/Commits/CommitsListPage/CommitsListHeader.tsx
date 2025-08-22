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

const getCommitsListHeader = (visibleColumns: Set<CommitColumnKeys>) => {
  // Use dynamic classes based on visible columns
  const dynamicClasses = getDynamicCommitsColumnClasses(visibleColumns);

  // Create column configs with dynamic classes
  const columnConfigs = COMMIT_COLUMN_ORDER.filter((col) => visibleColumns.has(col)).map((col) => {
    const originalColumn = commitsColumns.find((_, index) => COMMIT_COLUMN_ORDER[index] === col);
    return {
      ...originalColumn,
      className: dynamicClasses[col] || originalColumn?.className,
    };
  });

  const finalColumns = [
    ...columnConfigs,
    {
      title: ' ',
      className: dynamicClasses.kebab,
    },
  ];

  return createTableHeaders(finalColumns)(undefined, undefined, undefined);
};

const CommitsListHeader = ({ visibleColumns }: CommitsListHeaderProps) => {
  const headerFunc = getCommitsListHeader(visibleColumns);
  return headerFunc({
    data: [],
    unfilteredData: [],
    filters: [],
    selected: false,
    match: null,
    kindObj: null,
  });
};

export { getCommitsListHeader, commitsTableColumnClasses };
export default CommitsListHeader;
