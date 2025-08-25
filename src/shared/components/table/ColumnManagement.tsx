import React from 'react';
import {
  Modal,
  ModalVariant,
  Button,
  Form,
  FormGroup,
  Checkbox,
  Text,
  TextContent,
  TextVariants,
  Flex,
  FlexItem,
} from '@patternfly/react-core';

export interface ColumnDefinition<T extends string> {
  key: T;
  title: string;
  className?: string;
  sortable?: boolean;
}

export interface ColumnManagementProps<T extends string> {
  isOpen: boolean;
  onClose: () => void;
  visibleColumns: Set<T>;
  onVisibleColumnsChange: (columns: Set<T>) => void;
  columns: readonly ColumnDefinition<T>[];
  defaultVisibleColumns: Set<T>;
  nonHidableColumns: readonly T[];
  title?: string;
  description?: string;
}

function ColumnManagement<T extends string>({
  isOpen,
  onClose,
  visibleColumns,
  onVisibleColumnsChange,
  columns,
  defaultVisibleColumns,
  nonHidableColumns,
  title = 'Manage columns',
  description = 'Selected columns will be displayed in the table.',
}: ColumnManagementProps<T>) {
  const [localVisibleColumns, setLocalVisibleColumns] = React.useState<Set<T>>(visibleColumns);
  const previouslyOpen = React.useRef(false);

  React.useEffect(() => {
    // Only sync when modal first opens, not when it's already open
    if (isOpen && !previouslyOpen.current) {
      setLocalVisibleColumns(new Set(visibleColumns));
    }
    previouslyOpen.current = isOpen;
  }, [isOpen, visibleColumns]);

  const handleColumnToggle = (columnKey: T) => {
    const newColumns = new Set(localVisibleColumns);
    if (newColumns.has(columnKey)) {
      // Don't allow hiding non-hidable columns
      if (!nonHidableColumns.includes(columnKey)) {
        newColumns.delete(columnKey);
      }
    } else {
      newColumns.add(columnKey);
    }
    setLocalVisibleColumns(newColumns);
  };

  const handleSave = () => {
    onVisibleColumnsChange(localVisibleColumns);
    onClose();
  };

  const handleReset = () => {
    setLocalVisibleColumns(new Set(defaultVisibleColumns));
  };

  // Show all columns, but non-hidable ones will be disabled

  return (
    <Modal
      variant={ModalVariant.medium}
      title={title}
      isOpen={isOpen}
      onClose={onClose}
      actions={[
        <Button key="save" variant="primary" onClick={handleSave}>
          Save
        </Button>,
        <Button key="cancel" variant="link" onClick={onClose}>
          Cancel
        </Button>,
      ]}
    >
      <TextContent>
        <Text component={TextVariants.p}>{description}</Text>
      </TextContent>
      <Form>
        <FormGroup>
          <Flex direction={{ default: 'column' }}>
            <FlexItem className="pf-v5-u-my-md">
              <Button variant="primary" onClick={handleReset}>
                Reset to default
              </Button>
            </FlexItem>
            {columns.map((column) => (
              <FlexItem key={column.key}>
                <Checkbox
                  id={`column-${column.key}`}
                  label={column.title}
                  isChecked={localVisibleColumns.has(column.key)}
                  onChange={() => handleColumnToggle(column.key)}
                  isDisabled={nonHidableColumns.includes(column.key)}
                />
              </FlexItem>
            ))}
          </Flex>
        </FormGroup>
      </Form>
    </Modal>
  );
}

export default ColumnManagement;
