import * as React from 'react';
import {
  Button,
  ButtonVariant,
  Content,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  ModalVariant,
} from '@patternfly/react-core';
import {
  RawComponentProps,
  createRawModalLauncher,
} from '~/shared/components/modal/createModalLauncher';

type SavedViewDeleteModalProps = RawComponentProps & {
  viewLabel: string;
  onDelete: () => void;
};

export const SavedViewDeleteModal: React.FC<React.PropsWithChildren<SavedViewDeleteModalProps>> = ({
  onClose,
  viewLabel,
  onDelete,
  modalProps,
}) => {
  const { isOpen, variant, title, ...rest } = modalProps || {};

  const handleDelete = () => {
    onDelete();
    onClose?.();
  };

  return (
    <Modal {...rest} variant={variant} isOpen={isOpen} onClose={onClose}>
      <ModalHeader title={title} />
      <ModalBody>
        <Content>
          Are you sure you want to delete <strong>{viewLabel}</strong>? This action cannot be
          undone.
        </Content>
      </ModalBody>
      <ModalFooter>
        <Button
          variant={ButtonVariant.danger}
          onClick={handleDelete}
          data-test="saved-view-delete-confirm"
        >
          Delete
        </Button>
        <Button variant={ButtonVariant.link} onClick={() => onClose?.()}>
          Cancel
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export const createSavedViewDeleteModal = (props: SavedViewDeleteModalProps) =>
  createRawModalLauncher(SavedViewDeleteModal, {
    'data-test': 'saved-view-delete-modal',
    title: 'Delete saved view',
    variant: ModalVariant.small,
  })(props);
