import React from 'react';
import { Tr, Td } from '@patternfly/react-table';

/** Props for the {@link GroupHeader} component. */
interface GroupHeaderProps {
  /** Unique identifier for the group, used in the `data-test` attribute. */
  groupId: string;
  /** Display name of the group shown in the header. */
  groupName: string;
  /** Number of rows in this group, displayed as a count badge. */
  rowCount: number;
  /** Number of visible columns, used for `colSpan` on the group label cell. */
  visibleColumnCount: number;
  /** Whether the group's rows are currently expanded (visible). */
  isExpanded: boolean;
  /** Callback to toggle the group's expanded/collapsed state. */
  onToggle: () => void;
  /** Index of this group header, used for unique ARIA IDs on the expand toggle. */
  groupIndex: number;
}

/**
 * Renders a collapsible group header row for grouped tables.
 *
 * Displays the group name and row count, with an expand/collapse toggle.
 * The label spans all visible columns (minus the toggle cell).
 *
 * @example
 * ```tsx
 * <GroupHeader
 *   groupId="failed"
 *   groupName="Failed"
 *   rowCount={3}
 *   visibleColumnCount={5}
 *   isExpanded={true}
 *   onToggle={() => toggleGroup('failed')}
 *   groupIndex={0}
 * />
 * ```
 */
export const GroupHeader: React.FC<GroupHeaderProps> = ({
  groupId,
  groupName,
  rowCount,
  visibleColumnCount,
  isExpanded,
  onToggle,
  groupIndex,
}) => (
  <Tr data-test={`group-header-${groupId}`}>
    <Td
      expand={{
        rowIndex: groupIndex,
        isExpanded,
        onToggle,
      }}
    />
    <Td colSpan={visibleColumnCount - 1}>
      {groupName} ({rowCount})
    </Td>
  </Tr>
);
