import * as React from 'react';
import {
  Button,
  ButtonVariant,
  Form,
  FormGroup,
  FormHelperText,
  HelperText,
  HelperTextItem,
  ModalVariant,
  Flex,
  TextInput,
} from '@patternfly/react-core';
import { ComponentProps, createModalLauncher } from '~/shared/components/modal/createModalLauncher';

type SavedViewSaveModalProps = ComponentProps & {
  onSave: (name: string, slug: string | undefined) => void;
};

export const SavedViewSaveModal: React.FC<SavedViewSaveModalProps> = ({ onClose, onSave }) => {
  const [name, setName] = React.useState('');
  const [slug, setSlug] = React.useState('');

  const handleSave = () => {
    onSave(name, slug || undefined);
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
          placeholder="Enter a name"
          isRequired
        />
      </FormGroup>
      <FormGroup label="Slug" fieldId="saved-view-slug">
        <TextInput
          id="saved-view-slug"
          data-test="saved-view-slug-input"
          value={slug}
          onChange={(_e, value) => setSlug(value)}
          placeholder="e.g. my-build-failures"
        />
        <FormHelperText>
          <HelperText>
            <HelperTextItem>URL-safe identifier. Auto-generated if empty.</HelperTextItem>
          </HelperText>
        </FormHelperText>
      </FormGroup>
      <Flex>
        <Button
          variant={ButtonVariant.primary}
          onClick={handleSave}
          isDisabled={!name.trim()}
          data-test="saved-view-save-confirm"
        >
          Save
        </Button>
        <Button variant={ButtonVariant.link} onClick={() => onClose()}>
          Cancel
        </Button>
      </Flex>
    </Form>
  );
};

export const createSavedViewSaveModal = createModalLauncher(SavedViewSaveModal, {
  'data-test': 'saved-view-save-modal',
  title: 'Save view',
  variant: ModalVariant.small,
});
