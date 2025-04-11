import { SortByDirection, ThProps } from '@patternfly/react-table';
import { HeaderFunc } from '~/shared/components/table/Table';

export type ColumnConfig = {
  title: string;
  className: string;
  sortable?: boolean;
};

export const createTableHeaders = (
  columnConfig: ColumnConfig[],
): ((
  activeIndex: number,
  activeDirection: SortByDirection,
  onSort: ThProps['sort']['onSort'],
) => HeaderFunc) => {
  return (activeIndex, activeDirection, onSort) => () => {
    const getSortParams = (columnIndex: number) => ({
      columnIndex,
      sortBy: { index: activeIndex, direction: activeDirection },
      onSort,
    });

    return columnConfig.map((column, index) => ({
      title: column.title,
      props: {
        className: column.className,
        ...(column.sortable && { sort: getSortParams(index) }),
      },
    }));
  };
};
