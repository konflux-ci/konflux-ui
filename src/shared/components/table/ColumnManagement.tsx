import React from 'react';
import {
  Button,
  Form,
  FormGroup,
  Checkbox,
  Content,
  ContentVariants,
  Flex,
  FlexItem,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  ModalVariant,
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
    if (isOpen && !previouslyOpen.current) {
      setLocalVisibleColumns(new Set(visibleColumns));
    }
    previouslyOpen.current = isOpen;
  }, [isOpen, visibleColumns]);

  const handleColumnToggle = (columnKey: T) => {
    const newColumns = new Set(localVisibleColumns);
    if (newColumns.has(columnKey)) {
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

  return (
    <Modal variant={ModalVariant.medium} isOpen={isOpen} onClose={onClose}>
      <ModalHeader title={title} />
      <ModalBody>
        <Content>
          <Content component={ContentVariants.p}>{description}</Content>
        </Content>
        <Form>
          <FormGroup>
            <Flex direction={{ default: 'column' }}>
              <FlexItem className="pf-v6-u-my-md">
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
      </ModalBody>
      <ModalFooter>
        <Button key="save" variant="primary" onClick={handleSave}>
          Save
        </Button>
        <Button key="cancel" variant="link" onClick={onClose}>
          Cancel
        </Button>
      </ModalFooter>
    </Modal>
  );
}

export default ColumnManagement;
