import * as React from 'react';
import { Table, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table';
import type { UIConformaData } from '~/types/conforma';
import { getRuleStatus } from '~/utils/conforma-utils';

export type PolicyConformaTableProps = {
  results: UIConformaData[];
};

const PolicyConformaTable: React.FC<PolicyConformaTableProps> = ({ results }) => {
  return (
    <Table aria-label="Policy conforma results" variant="compact">
      <Thead>
        <Tr>
          <Th>Rule</Th>
          <Th>Status</Th>
          <Th>Message</Th>
          <Th>Component</Th>
          <Th>Policy used</Th>
        </Tr>
      </Thead>
      <Tbody>
        {results.map((row, index) => (
          <Tr key={`${row.component}-${row.title}-${index}`}>
            <Td dataLabel="Rule">{row.title}</Td>
            <Td dataLabel="Status">{getRuleStatus(row.status)}</Td>
            <Td dataLabel="Message">{row.msg ?? '-'}</Td>
            <Td dataLabel="Component">{row.component}</Td>
            <Td dataLabel="Policy used">
              {row.collection?.length ? row.collection.join(', ') : '-'}
            </Td>
          </Tr>
        ))}
      </Tbody>
    </Table>
  );
};

export default PolicyConformaTable;
