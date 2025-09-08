import * as React from 'react';

export type TableDataProps = {
  className?: string;
  columnID?: string;
  columns?: Set<string>;
  id?: string;
  style?: React.CSSProperties;
};

export const TableData: React.FC<React.PropsWithChildren<TableDataProps>> = ({
  className,
  ...props
}) => <td {...props} className={className} role="gridcell" />;
