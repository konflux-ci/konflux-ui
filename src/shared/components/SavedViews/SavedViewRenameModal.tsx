import * as React from 'react';
import {
  Button,
  ButtonVariant,
  Form,
  FormGroup,
  ModalVariant,
  TextInput,
} from '@patternfly/react-core';
import { ComponentProps, createModalLauncher } from '~/shared/components/modal/createModalLauncher';

type SavedViewRenameModalProps = ComponentProps & {
  currentLabel: string;
  onRename: (newLabel: string) => void;
};

export const SavedViewRenameModal: React.FC<SavedViewRenameModalProps> = ({
  onClose,
  currentLabel,
  onRename,
}) => {
  const [name, setName] = React.useState(currentLabel);

  const handleRename = () => {
    onRename(name);
    onClose();
  };

  return (
    <Form>
      <FormGroup label="Name" isRequired fieldId="saved-view-name">
        <TextInput
          id="saved-view-name"
          data-test="saved-view-name-input"
          value={name}
          onChange={(_e, value) => setName(value)}
          isRequired
        />
      </FormGroup>
      <Button
        variant={ButtonVariant.primary}
        onClick={handleRename}
        isDisabled={!name.trim()}
        data-test="saved-view-rename-confirm"
      >
        Rename
      </Button>
      <Button variant={ButtonVariant.link} onClick={() => onClose()}>
        Cancel
      </Button>
    </Form>
  );
};

export const createSavedViewRenameModal = createModalLauncher(SavedViewRenameModal, {
  'data-test': 'saved-view-rename-modal',
  title: 'Rename saved view',
  variant: ModalVariant.small,
});
