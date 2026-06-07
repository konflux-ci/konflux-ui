import * as React from 'react';
import { Button, ButtonVariant, ModalVariant, Text, TextContent } from '@patternfly/react-core';
import { ComponentProps, createModalLauncher } from '~/components/modal/createModalLauncher';

type SavedViewDeleteModalProps = ComponentProps & {
  viewLabel: string;
  onDelete: () => void;
};

export const SavedViewDeleteModal: React.FC<SavedViewDeleteModalProps> = ({
  onClose,
  viewLabel,
  onDelete,
}) => {
  const handleDelete = () => {
    onDelete();
    onClose();
  };

  return (
    <>
      <TextContent>
        <Text>
          Are you sure you want to delete <strong>{viewLabel}</strong>? This action cannot be
          undone.
        </Text>
      </TextContent>
      <Button
        variant={ButtonVariant.danger}
        onClick={handleDelete}
        data-test="saved-view-delete-confirm"
      >
        Delete
      </Button>
      <Button variant={ButtonVariant.link} onClick={() => onClose()}>
        Cancel
      </Button>
    </>
  );
};

export const createSavedViewDeleteModal = createModalLauncher(SavedViewDeleteModal, {
  'data-test': 'saved-view-delete-modal',
  title: 'Delete saved view',
  variant: ModalVariant.small,
  titleIconVariant: 'warning',
});
