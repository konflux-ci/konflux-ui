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
import { SnapshotColumnKey, snapshotColumns, defaultVisibleColumns } from './SnapshotsListHeader';

type SnapshotsColumnManagementProps = {
  isOpen: boolean;
  onClose: () => void;
  visibleColumns: Set<SnapshotColumnKey>;
  onVisibleColumnsChange: (columns: Set<SnapshotColumnKey>) => void;
};

const SnapshotsColumnManagement: React.FC<SnapshotsColumnManagementProps> = ({
  isOpen,
  onClose,
  visibleColumns,
  onVisibleColumnsChange,
}) => {
  const [localVisibleColumns, setLocalVisibleColumns] =
    React.useState<Set<SnapshotColumnKey>>(visibleColumns);

  React.useEffect(() => {
    if (isOpen) {
      setLocalVisibleColumns(new Set(visibleColumns));
    }
  }, [isOpen, visibleColumns]);

  const handleColumnToggle = (columnKey: SnapshotColumnKey) => {
    const newColumns = new Set(localVisibleColumns);
    if (newColumns.has(columnKey)) {
      // Don't allow hiding the name column or kebab column
      if (columnKey !== 'name' && columnKey !== 'kebab') {
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

  const managableColumns = snapshotColumns.filter((col) => col.key !== 'kebab');

  return (
    <Modal
      variant={ModalVariant.medium}
      title="Manage columns"
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
        <Text component={TextVariants.p}>
          Selected columns will be displayed in the table. You can drag and drop columns to reorder
          them.
        </Text>
      </TextContent>
      <Form>
        <FormGroup>
          <Flex direction={{ default: 'column' }}>
            <FlexItem>
              <Button
                variant="link"
                onClick={handleReset}
                style={{ padding: 0, marginBottom: '1rem' }}
              >
                Reset to default
              </Button>
            </FlexItem>
            {managableColumns.map((column) => (
              <FlexItem key={column.key}>
                <Checkbox
                  id={`column-${column.key}`}
                  label={column.title}
                  isChecked={localVisibleColumns.has(column.key)}
                  onChange={() => handleColumnToggle(column.key)}
                  isDisabled={column.key === 'name'} // Name column should always be visible
                />
              </FlexItem>
            ))}
          </Flex>
        </FormGroup>
      </Form>
    </Modal>
  );
};

export default SnapshotsColumnManagement;
