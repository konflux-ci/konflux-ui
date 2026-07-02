import * as React from 'react';
import {
  Button,
  ButtonVariant,
  Form,
  FormGroup,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  ModalVariant,
  TextInput,
} from '@patternfly/react-core';

const MAX_TOPIC_SUMMARY_LENGTH = 1000; // Lightspeed API limit for topic summary
const RENAME_CONVERSATION_TITLE_ID = 'ai-chat-rename-conversation-title';

export type AIChatRenameConversationModalProps = {
  appendTo: () => HTMLElement;
  currentName: string;
  isOpen: boolean;
  isSubmitting?: boolean;
  onClose: () => void;
  onRename: (newName: string) => void;
};

export const AIChatRenameConversationModal: React.FC<AIChatRenameConversationModalProps> = ({
  appendTo,
  currentName,
  isOpen,
  isSubmitting = false,
  onClose,
  onRename,
}) => {
  const [name, setName] = React.useState(currentName);

  React.useEffect(() => {
    if (isOpen) {
      setName(currentName);
    }
  }, [currentName, isOpen]);

  const handleRename = () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      return;
    }

    onRename(trimmedName);
  };

  return (
    <Modal
      appendTo={appendTo}
      aria-labelledby={RENAME_CONVERSATION_TITLE_ID}
      className="konflux-ai-chat__rename-modal"
      data-test="ai-chat-rename-conversation-modal"
      isOpen={isOpen}
      onClose={onClose}
      variant={ModalVariant.small}
    >
      <ModalHeader labelId={RENAME_CONVERSATION_TITLE_ID} title="Rename conversation" />
      <ModalBody>
        <Form>
          <FormGroup fieldId="ai-chat-conversation-name" isRequired label="Name">
            <TextInput
              autoFocus
              id="ai-chat-conversation-name"
              data-test="ai-chat-conversation-name-input"
              isRequired
              maxLength={MAX_TOPIC_SUMMARY_LENGTH}
              name="ai-chat-conversation-name"
              onChange={(_event, value) => setName(value)}
              value={name}
            />
          </FormGroup>
        </Form>
      </ModalBody>
      <ModalFooter>
        <Button variant={ButtonVariant.link} onClick={onClose}>
          Cancel
        </Button>
        <Button
          data-test="ai-chat-rename-conversation-confirm"
          isDisabled={!name.trim() || isSubmitting}
          isLoading={isSubmitting}
          onClick={handleRename}
          variant={ButtonVariant.primary}
        >
          Rename
        </Button>
      </ModalFooter>
    </Modal>
  );
};
