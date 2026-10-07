import React from 'react';
import { Button } from '@patternfly/react-core';
import { TableIcon } from '@patternfly/react-icons/dist/esm/icons/table-icon';
import { useModalLauncher } from '~/components/modal/ModalProvider';
import { ColumnDefinition, DefaultSort, useColumnState } from '~/shared/components/TableV2';
import { deriveDefaultState } from '~/shared/components/TableV2/hooks/useColumnState';
import { columnManagementModalLauncher } from './ColumnManagementModal';

interface ColumnManagementProps<T> {
  columns: ColumnDefinition<T>[];
  columnStateKey: string;
  /** Column IDs shown when no saved column state exists. */
  defaultVisibleColumns?: string[];
  /** Sort restored by Restore defaults and applied when no saved state exists. */
  defaultSort?: DefaultSort;
  'data-tour'?: string;
}

const ColumnManagement_ = <T,>({
  columns,
  columnStateKey,
  defaultVisibleColumns,
  defaultSort,
  'data-tour': dataTour,
}: ColumnManagementProps<T>) => {
  const { columnState, setColumnState } = useColumnState(
    columnStateKey,
    columns,
    defaultVisibleColumns,
    defaultSort,
  );
  const showModal = useModalLauncher();

  const defaultColumnState = React.useMemo(
    () => deriveDefaultState(columns, defaultVisibleColumns, defaultSort),
    [columns, defaultVisibleColumns, defaultSort],
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
    <Button
      variant="plain"
      aria-label="Manage columns"
      onClick={openColumnManagement}
      isInline
      data-tour={dataTour}
    >
      <TableIcon />
    </Button>
  );
};

function ColumnManagement<T>({
  columns,
  columnStateKey,
  defaultVisibleColumns,
  defaultSort,
  showColumnManagement = false,
  'data-tour': dataTour,
}: ColumnManagementProps<T> & { showColumnManagement?: boolean }) {
  if (!showColumnManagement && columns.length <= 5) {
    return null;
  }
  return (
    <ColumnManagement_<T>
      columns={columns}
      columnStateKey={columnStateKey}
      defaultVisibleColumns={defaultVisibleColumns}
      defaultSort={defaultSort}
      data-tour={dataTour}
    />
  );
}

export default ColumnManagement;
