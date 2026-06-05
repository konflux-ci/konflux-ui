import React, { type ReactNode } from 'react';
import { TableSkeleton } from './TableSkeleton';

interface TableContainerComponentProps {
  data: unknown[];
  unfilteredData: unknown[];
  loaded: boolean;
  loadError?: Error;
  skeleton?: ReactNode;
  emptyState?: ReactNode;
  noDataState?: ReactNode;
  toolbar?: ReactNode;
  children: ReactNode;
}

export const TableContainer: React.FC<TableContainerComponentProps> = ({
  data,
  unfilteredData,
  loaded,
  loadError,
  skeleton,
  emptyState,
  noDataState,
  toolbar,
  children,
}) => {
  const renderContent = (): ReactNode => {
    if (!loaded) {
      return skeleton ?? <TableSkeleton columns={3} />;
    }
    if (loadError) {
      return <div data-test="table-error">{loadError.message}</div>;
    }
    if (unfilteredData.length === 0) {
      return noDataState ?? null;
    }
    if (data.length === 0) {
      return emptyState ?? null;
    }
    return children;
  };

  return (
    <div data-test="table-container">
      {toolbar}
      {renderContent()}
    </div>
  );
};
