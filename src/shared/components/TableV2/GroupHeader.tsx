import React from 'react';
import { Tr, Td } from '@patternfly/react-table';

interface GroupHeaderProps {
  groupId: string;
  groupName: string;
  rowCount: number;
  visibleColumnCount: number;
  isExpanded: boolean;
  onToggle: () => void;
}

export const GroupHeader: React.FC<GroupHeaderProps> = ({
  groupId,
  groupName,
  rowCount,
  visibleColumnCount,
  isExpanded,
  onToggle,
}) => (
  <Tr data-test={`group-header-${groupId}`}>
    <Td
      expand={{
        rowIndex: 0,
        isExpanded,
        onToggle,
      }}
    />
    <Td colSpan={visibleColumnCount - 1}>
      {groupName} ({rowCount})
    </Td>
  </Tr>
);
