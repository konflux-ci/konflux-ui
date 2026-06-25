import React from 'react';
import { Skeleton } from '@patternfly/react-core';
import { Table, Thead, Tbody, Tr, Th, Td } from '@patternfly/react-table';

/** Props for the {@link TableSkeleton} loading placeholder. */
interface TableSkeletonProps {
  /** Number of skeleton columns to render. */
  columns: number;
  /** Number of skeleton rows to render. Defaults to `5`. */
  rows?: number;
}

/**
 * Renders a skeleton loading placeholder that mimics the shape of a table.
 *
 * Used by {@link TableContainer} as the default loading state. Renders
 * PatternFly `Skeleton` bars in a table layout with varying widths to
 * create a natural shimmer effect.
 *
 * @example
 * ```tsx
 * <TableSkeleton columns={4} rows={10} />
 * ```
 */
export const TableSkeleton: React.FC<TableSkeletonProps> = ({ columns, rows = 5 }) => (
  <Table variant="compact" data-test="table-skeleton">
    <Thead>
      <Tr>
        {Array.from({ length: columns }, (_, i) => (
          <Th key={i}>
            <Skeleton width="60%" screenreaderText={i === 0 ? 'Loading table' : undefined} />
          </Th>
        ))}
      </Tr>
    </Thead>
    <Tbody>
      {Array.from({ length: rows }, (_r, rowIdx) => (
        <Tr key={rowIdx}>
          {Array.from({ length: columns }, (_c, colIdx) => (
            <Td key={colIdx}>
              <Skeleton width={`${50 + ((rowIdx + colIdx) % 4) * 10}%`} />
            </Td>
          ))}
        </Tr>
      ))}
    </Tbody>
  </Table>
);
