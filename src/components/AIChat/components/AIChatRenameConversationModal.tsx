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
import {
  KONFLUX_AI_MAX_TOPIC_SUMMARY_LENGTH,
  KONFLUX_AI_RENAME_CONVERSATION_TITLE_ID,
} from '~/components/AIChat/const';

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

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting || !name.trim()) {
      return;
    }

    handleRename();
  };

  return (
    <Modal
      appendTo={appendTo}
      aria-labelledby={KONFLUX_AI_RENAME_CONVERSATION_TITLE_ID}
      data-test="ai-chat-rename-conversation-modal"
      isOpen={isOpen}
      onClose={onClose}
      variant={ModalVariant.small}
    >
      <ModalHeader
        labelId={KONFLUX_AI_RENAME_CONVERSATION_TITLE_ID}
        title="Rename conversation"
      />
      <ModalBody>
        <Form onSubmit={handleSubmit}>
          <FormGroup fieldId="ai-chat-conversation-name" isRequired label="Name">
            <TextInput
              autoFocus
              id="ai-chat-conversation-name"
              data-test="ai-chat-conversation-name-input"
              isRequired
              maxLength={KONFLUX_AI_MAX_TOPIC_SUMMARY_LENGTH}
              name="ai-chat-conversation-name"
              onChange={(_event, value) => setName(value)}
              value={name}
            />
          </FormGroup>
        </Form>
      </ModalBody>
      <ModalFooter>
        <Button
          data-test="ai-chat-rename-conversation-confirm"
          isDisabled={!name.trim() || isSubmitting}
          isLoading={isSubmitting}
          onClick={handleRename}
          variant={ButtonVariant.primary}
        >
          Rename
        </Button>
        <Button variant={ButtonVariant.link} onClick={onClose}>
          Cancel
        </Button>
      </ModalFooter>
    </Modal>
  );
};
