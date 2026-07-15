import React, { useState, useCallback } from 'react';
import {
  ActionGroup,
  Button,
  Checkbox,
  DataList,
  DataListCell,
  DataListItem,
  DataListItemCells,
  DataListItemRow,
  ModalVariant,
} from '@patternfly/react-core';
import { DragDropSort, type DraggableObject } from '@patternfly/react-drag-drop';
import { type ColumnState } from '~/shared/components/TableV2';
import { type ComponentProps, createModalLauncher } from '../modal/createModalLauncher';

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

export const ColumnManagementModal: React.FC<ColumnManagementModalProps> = ({
  columns,
  columnState,
  defaultColumnState,
  onSave,
  onClose,
}) => {
  const [allColumnsOrder, setAllColumnsOrder] = useState<string[]>(() => columnState.columnOrder);
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

  const handleDrop = useCallback(
    (_event: unknown, items: DraggableObject[]) => {
      setAllColumnsOrder((prev) => {
        const pinnedStartIds = prev.filter((id) => columnsById.get(id)?.pinned === 'start');
        const pinnedEndIds = prev.filter((id) => columnsById.get(id)?.pinned === 'end');
        const reorderedUnpinned = items.map((item) => String(item.id));
        return [...pinnedStartIds, ...reorderedUnpinned, ...pinnedEndIds];
      });
    },
    [columnsById],
  );

  const handleReset = useCallback(() => {
    setAllColumnsOrder(defaultColumnState.columnOrder);
    setVisibleSet(new Set(defaultColumnState.visibleColumns));
  }, [defaultColumnState]);

  const handleSave = useCallback(() => {
    const newState: ColumnState = {
      ...columnState,
      columnOrder: allColumnsOrder,
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

  const renderColumnRowContent = (id: string) => {
    const col = columnsById.get(id);
    if (!col) return null;

    const isPinned = !!col.pinned;
    const isNonHidable = !!col.nonHidable;
    const isChecked = visibleSet.has(id);
    const isCheckboxDisabled = isNonHidable || isPinned;

    return (
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
          ]}
        />
      </DataListItemRow>
    );
  };

  const pinnedRow = (id: string) => (
    <DataListItem key={id} data-test={`column-row-${id}`}>
      {renderColumnRowContent(id)}
    </DataListItem>
  );

  const draggableItems: DraggableObject[] = unpinned.map((id) => ({
    id,
    content: renderColumnRowContent(id),
  }));

  return (
    <>
      <DataList aria-label="Column management" isCompact>
        {pinnedStart.map(pinnedRow)}
      </DataList>
      <DragDropSort items={draggableItems} onDrop={handleDrop} variant="DataList">
        <DataList aria-label="Reorderable columns" isCompact />
      </DragDropSort>
      <DataList aria-label="Pinned end columns" isCompact>
        {pinnedEnd.map(pinnedRow)}
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
