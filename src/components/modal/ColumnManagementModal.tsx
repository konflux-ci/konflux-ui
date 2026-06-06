import React, { useState, useCallback } from 'react';
import {
  ActionGroup,
  Button,
  DataList,
  DataListCell,
  DataListItem,
  DataListItemCells,
  DataListItemRow,
  Checkbox,
  ModalVariant,
} from '@patternfly/react-core';
import { ArrowDownIcon } from '@patternfly/react-icons/dist/esm/icons/arrow-down-icon';
import { ArrowUpIcon } from '@patternfly/react-icons/dist/esm/icons/arrow-up-icon';
import { type ColumnState } from '~/shared/components/TableV2';
import { type ComponentProps, createModalLauncher } from './createModalLauncher';

interface ColumnInfo {
  id: string;
  header: string;
  nonHidable?: boolean;
  pinned?: 'start' | 'end';
}

interface ColumnManagementModalProps extends ComponentProps {
  columns: ColumnInfo[];
  columnState: ColumnState;
  defaultColumnState: ColumnState;
  onSave: (state: ColumnState) => void;
}

const buildOrderedColumns = (columns: ColumnInfo[], visibleColumns: string[]): string[] => {
  // Start with visible columns in their order, then append any hidden ones
  const allIds = columns.map((c) => c.id);
  const ordered: string[] = [];

  // First, add visible columns in their saved order
  for (const id of visibleColumns) {
    if (allIds.includes(id)) {
      ordered.push(id);
    }
  }
  // Then add any columns not in visibleColumns (hidden ones)
  for (const id of allIds) {
    if (!ordered.includes(id)) {
      ordered.push(id);
    }
  }
  return ordered;
};

export const ColumnManagementModal: React.FC<ColumnManagementModalProps> = ({
  columns,
  columnState,
  defaultColumnState,
  onSave,
  onClose,
}) => {
  const [allColumnsOrder, setAllColumnsOrder] = useState<string[]>(() =>
    buildOrderedColumns(columns, columnState.visibleColumns),
  );
  const [visibleSet, setVisibleSet] = useState<Set<string>>(
    () => new Set(columnState.visibleColumns),
  );

  const columnsById = React.useMemo(() => {
    const map = new Map<string, ColumnInfo>();
    columns.forEach((col) => map.set(col.id, col));
    return map;
  }, [columns]);

  const handleToggle = useCallback((id: string) => {
    setVisibleSet((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleMoveUp = useCallback((id: string) => {
    setAllColumnsOrder((prev) => {
      const idx = prev.indexOf(id);
      if (idx <= 0) return prev;
      const next = [...prev];
      [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
      return next;
    });
  }, []);

  const handleMoveDown = useCallback((id: string) => {
    setAllColumnsOrder((prev) => {
      const idx = prev.indexOf(id);
      if (idx < 0 || idx >= prev.length - 1) return prev;
      const next = [...prev];
      [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
      return next;
    });
  }, []);

  const handleReset = useCallback(() => {
    setAllColumnsOrder(buildOrderedColumns(columns, defaultColumnState.visibleColumns));
    setVisibleSet(new Set(defaultColumnState.visibleColumns));
  }, [columns, defaultColumnState]);

  const handleSave = useCallback(() => {
    const newState: ColumnState = {
      ...columnState,
      visibleColumns: allColumnsOrder.filter((id) => visibleSet.has(id)),
    };
    onSave(newState);
    onClose?.();
  }, [allColumnsOrder, visibleSet, columnState, onSave, onClose]);

  const handleCancel = useCallback(() => {
    onClose?.();
  }, [onClose]);

  // Separate pinned-start, unpinned, and pinned-end
  const pinnedStart = allColumnsOrder.filter((id) => columnsById.get(id)?.pinned === 'start');
  const unpinned = allColumnsOrder.filter((id) => !columnsById.get(id)?.pinned);
  const pinnedEnd = allColumnsOrder.filter((id) => columnsById.get(id)?.pinned === 'end');

  const orderedIds = [...pinnedStart, ...unpinned, ...pinnedEnd];

  const renderColumnRow = (id: string) => {
    const col = columnsById.get(id);
    if (!col) return null;

    const isPinned = !!col.pinned;
    const isNonHidable = !!col.nonHidable;
    const isChecked = visibleSet.has(id);
    const isCheckboxDisabled = isNonHidable || isPinned;

    // Determine if reorder buttons should be disabled
    const isReorderDisabled = isPinned;
    const unpinnedIndex = unpinned.indexOf(id);
    const isFirst = unpinnedIndex === 0;
    const isLast = unpinnedIndex === unpinned.length - 1;

    return (
      <DataListItem key={id} data-test={`column-row-${id}`}>
        <DataListItemRow>
          <DataListItemCells
            dataListCells={[
              <DataListCell key="checkbox">
                <Checkbox
                  id={`col-checkbox-${id}`}
                  label={col.header}
                  isChecked={isChecked}
                  isDisabled={isCheckboxDisabled}
                  onChange={() => handleToggle(id)}
                />
              </DataListCell>,
              <DataListCell key="reorder" alignRight>
                <Button
                  variant="plain"
                  aria-label="Move up"
                  isDisabled={isReorderDisabled || isFirst}
                  onClick={() => handleMoveUp(id)}
                  size="sm"
                >
                  <ArrowUpIcon />
                </Button>
                <Button
                  variant="plain"
                  aria-label="Move down"
                  isDisabled={isReorderDisabled || isLast}
                  onClick={() => handleMoveDown(id)}
                  size="sm"
                >
                  <ArrowDownIcon />
                </Button>
              </DataListCell>,
            ]}
          />
        </DataListItemRow>
      </DataListItem>
    );
  };

  return (
    <>
      <DataList aria-label="Column management" isCompact>
        {orderedIds.map(renderColumnRow)}
      </DataList>
      <ActionGroup>
        <Button variant="link" onClick={handleReset}>
          Restore defaults
        </Button>
      </ActionGroup>
      <ActionGroup>
        <Button variant="primary" onClick={handleSave}>
          Save
        </Button>
        <Button variant="link" onClick={handleCancel}>
          Cancel
        </Button>
      </ActionGroup>
    </>
  );
};

export const columnManagementModalLauncher = createModalLauncher(ColumnManagementModal, {
  'data-test': 'column-management-modal',
  variant: ModalVariant.medium,
  title: 'Manage columns',
});
