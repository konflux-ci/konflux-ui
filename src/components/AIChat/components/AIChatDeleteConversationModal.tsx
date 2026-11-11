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
import { KONFLUX_AI_DELETE_CONVERSATION_TITLE_ID } from '~/components/AIChat/const';

type AIChatDeleteConversationModalProps = {
  appendTo: () => HTMLElement;
  currentName: string;
  isOpen: boolean;
  isSubmitting?: boolean;
  onClose: () => void;
  onDelete: () => void;
};

export const AIChatDeleteConversationModal: React.FC<AIChatDeleteConversationModalProps> = ({
  appendTo,
  currentName,
  isOpen,
  isSubmitting = false,
  onClose,
  onDelete,
}) => {
  const handleDelete = () => {
    if (isSubmitting) {
      return;
    }

    onDelete();
  };

  return (
    <Modal
      appendTo={appendTo}
      aria-labelledby={KONFLUX_AI_DELETE_CONVERSATION_TITLE_ID}
      data-test="ai-chat-delete-conversation-modal"
      isOpen={isOpen}
      onClose={onClose}
      variant={ModalVariant.small}
    >
      <ModalHeader labelId={KONFLUX_AI_DELETE_CONVERSATION_TITLE_ID} title="Delete conversation" />
      <ModalBody>
        <Content>
          Are you sure you want to delete <strong>{currentName}</strong>? This action cannot be
          undone.
        </Content>
      </ModalBody>
      <ModalFooter>
        <Button
          data-test="ai-chat-delete-conversation-confirm"
          isDisabled={isSubmitting}
          isLoading={isSubmitting}
          onClick={handleDelete}
          variant={ButtonVariant.danger}
        >
          Delete
        </Button>
        <Button variant={ButtonVariant.link} onClick={onClose}>
          Cancel
        </Button>
      </ModalFooter>
    </Modal>
  );
};
