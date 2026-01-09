import * as React from 'react';
import { SortByDirection, ThProps } from '@patternfly/react-table';
import { HeaderFunc } from './Table';

export type ColumnConfig = {
  title: string | React.ReactNode;
  className: string;
  sortable?: boolean;
  style?: React.CSSProperties;
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
        style: column.style,
        ...(column.sortable && { sort: getSortParams(index) }),
      },
    }));
  };
};
