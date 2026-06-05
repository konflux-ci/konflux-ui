import React from 'react';
import { Skeleton } from '@patternfly/react-core';
import { Table, Thead, Tbody, Tr, Th, Td } from '@patternfly/react-table';

interface TableSkeletonProps {
  columns: number;
  rows?: number;
}

export const TableSkeleton: React.FC<TableSkeletonProps> = ({ columns, rows = 5 }) => (
  <Table aria-label="Loading" data-test="table-skeleton">
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
