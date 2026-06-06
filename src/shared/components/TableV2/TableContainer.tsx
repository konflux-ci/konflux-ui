import React, { type ReactNode } from 'react';
import { TableSkeleton } from './TableSkeleton';

/** Internal props for TableContainer (mirrors {@link TableContainerProps} without TData). */
interface TableContainerComponentProps {
  /** Filtered data (after search/filter). */
  data: unknown[];
  /** Unfiltered data (all rows before filtering). */
  unfilteredData: unknown[];
  /** Whether the initial data load has completed. */
  loaded: boolean;
  /** Error from the initial data load, if any. */
  loadError?: Error;
  /** Custom skeleton to show while loading. Defaults to a generic `TableSkeleton`. */
  skeleton?: ReactNode;
  /** Content to display when filters match no rows but unfiltered data exists. */
  emptyState?: ReactNode;
  /** Content to display when no data exists at all. */
  noDataState?: ReactNode;
  /** Toolbar rendered above the table content in all states. */
  toolbar?: ReactNode;
  /** The table content rendered when data is loaded and non-empty. */
  children: ReactNode;
}

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
