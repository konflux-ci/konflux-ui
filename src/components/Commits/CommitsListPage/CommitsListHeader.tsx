import { createTableHeaders } from '~/shared/components/table/utils';
import {
  CommitColumnKeys,
  commitsColumns,
  commitsTableColumnClasses,
  COMMIT_COLUMN_ORDER,
} from './commits-columns-config';

interface CommitsListHeaderProps {
  visibleColumns: Set<CommitColumnKeys>;
}

const getCommitsListHeader = (visibleColumns: Set<CommitColumnKeys>) => {
  const visibleColumnsConfig = commitsColumns.filter((_, index) =>
    visibleColumns.has(COMMIT_COLUMN_ORDER[index]),
  );

  const finalColumns = [
    ...visibleColumnsConfig,
    {
      title: ' ',
      className: commitsTableColumnClasses.kebab,
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
