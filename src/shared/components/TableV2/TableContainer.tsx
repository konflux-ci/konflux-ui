import React, { type ReactNode } from 'react';
import { TableSkeleton } from './TableSkeleton';
import { type TableContainerProps } from './types';

/**
 * State machine wrapper that selects the correct content to render based
 * on loading, error, and data conditions.
 *
 * Resolution order:
 * 1. `!loaded` → `skeleton` (defaults to `<TableSkeleton columns={3} />`)
 * 2. `loadError` → error message
 * 3. `unfilteredData.length === 0` → `noDataState` (no resources exist)
 * 4. `data.length === 0` → `emptyState` (resources exist but filters match nothing)
 * 5. Otherwise → `children` (the table)
 *
 * The `toolbar` is always rendered above the content regardless of state.
 *
 * @example
 * ```tsx
 * <TableContainer
 *   data={filteredRuns}
 *   unfilteredData={allRuns}
 *   loaded={loaded}
 *   loadError={error}
 *   emptyState={<EmptyFilterState onClear={clearFilters} />}
 *   noDataState={<EmptyState>No pipeline runs yet</EmptyState>}
 *   toolbar={<Toolbar filters={filters} />}
 * >
 *   <Table data={filteredRuns} columns={columns} ... />
 * </TableContainer>
 * ```
 */
export const TableContainer: React.FC<TableContainerProps<unknown>> = ({
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
