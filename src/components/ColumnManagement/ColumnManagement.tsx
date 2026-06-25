import React from 'react';
import { Button } from '@patternfly/react-core';
import { TableIcon } from '@patternfly/react-icons/dist/esm/icons/table-icon';
import { ColumnDefinition, ColumnState, useColumnState } from '~/shared/components/TableV2';
import { useModalLauncher } from '../modal/ModalProvider';
import { columnManagementModalLauncher } from './ColumnManagementModal';

interface ColumnManagementProps<T> {
  columns: ColumnDefinition<T>[];
  columnStateKey: string;
}

const ColumnManagement_ = <T,>({ columns, columnStateKey }: ColumnManagementProps<T>) => {
  const { columnState, setColumnState } = useColumnState(columnStateKey, columns);
  const showModal = useModalLauncher();

  const defaultColumnState: ColumnState = React.useMemo(
    () => ({
      visibleColumns: columns.map((c) => c.id),
      columnOrder: columns.map((c) => c.id),
    }),
    [columns],
  );

  const columnInfoForModal = React.useMemo(
    () =>
      columns.map((c) => ({
        id: c.id,
        header: typeof c.header === 'string' ? c.header : c.id,
        nonHidable: c.nonHidable,
        pinned: c.pinned,
      })),
    [columns],
  );

  const openColumnManagement = React.useCallback(() => {
    showModal(
      columnManagementModalLauncher({
        columns: columnInfoForModal,
        columnState,
        defaultColumnState,
        onSave: setColumnState,
      }),
    );
  }, [showModal, columnInfoForModal, columnState, defaultColumnState, setColumnState]);
  return (
    <Button variant="plain" aria-label="Manage columns" onClick={openColumnManagement} isInline>
      <TableIcon />
    </Button>
  );
};

function ColumnManagement<T>({
  columns,
  columnStateKey,
  showColumnManagement = false,
}: ColumnManagementProps<T> & { showColumnManagement?: boolean }) {
  if (!showColumnManagement && columns.length <= 5) {
    return null;
  }
  return <ColumnManagement_<T> columns={columns} columnStateKey={columnStateKey} />;
}

export default ColumnManagement;
