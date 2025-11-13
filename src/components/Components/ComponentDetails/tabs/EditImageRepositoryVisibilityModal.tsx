import * as React from 'react';
import {
  Alert,
  AlertVariant,
  Button,
  ButtonType,
  ButtonVariant,
  Flex,
  Form,
  ModalVariant,
  Stack,
  StackItem,
  Switch,
  TextVariants,
  Text,
} from '@patternfly/react-core';
import { Formik } from 'formik';
import { ComponentProps, createModalLauncher } from '~/components/modal/createModalLauncher';
import { ImageRepositoryKind, ImageRepositoryVisibility } from '~/types';
import { updateImageRepositoryVisibility } from '~/utils/component-utils';

type EditImageRepositoryVisibilityModalProps = ComponentProps & {
  imageRepository: ImageRepositoryKind;
};

export const EditImageRepositoryVisibilityModal: React.FC<
  React.PropsWithChildren<EditImageRepositoryVisibilityModalProps>
> = ({ imageRepository, onClose }) => {
  const isVisibilitySet = imageRepository?.spec?.image?.visibility !== undefined;
  // Default to private if not set (consistent with component creation default)
  const currentIsPrivate =
    imageRepository?.spec?.image?.visibility !== ImageRepositoryVisibility.public;

  const onSubmit = async (values: { isPrivate: boolean }, { setStatus }) => {
    try {
      await updateImageRepositoryVisibility(imageRepository, values.isPrivate);
      onClose(null, { submitClicked: true });
    } catch (e) {
      setStatus({ error: e instanceof Error ? e.message : String(e) });
    }
  };

  const onReset = () => {
    onClose(null, { submitClicked: false });
  };

  return (
    <Formik onSubmit={onSubmit} initialValues={{ isPrivate: currentIsPrivate }} onReset={onReset}>
      {({ handleSubmit, handleReset, isSubmitting, values, setFieldValue, status }) => {
        // Allow saving if visibility is not set (initial configuration) or if value changed
        const isChanged = !isVisibilitySet || values.isPrivate !== currentIsPrivate;

        return (
          <Form
            onSubmit={handleSubmit}
            onReset={handleReset}
            data-test="edit-image-repository-visibility-modal"
          >
            <Stack hasGutter>
              <StackItem>
                <Flex alignItems={{ default: 'alignItemsCenter' }}>
                  <Text component={TextVariants.p}>Should the image produced be private?</Text>

                  <Switch
                    id="visibility-switch"
                    aria-label="Image repository visibility"
                    isChecked={values.isPrivate}
                    onChange={(_, checked) => setFieldValue('isPrivate', checked)}
                    data-test="visibility-switch"
                  />
                </Flex>
              </StackItem>

              {status?.error && (
                <StackItem>
                  <Alert
                    isInline
                    variant={AlertVariant.danger}
                    title="An error occurred"
                    data-test="error-alert"
                  >
                    {status.error}
                  </Alert>
                </StackItem>
              )}

              <StackItem>
                <Button
                  type={ButtonType.submit}
                  isLoading={isSubmitting}
                  isDisabled={!isChanged || isSubmitting}
                  data-test="save-visibility-button"
                >
                  Save
                </Button>
                <Button
                  type={ButtonType.reset}
                  variant={ButtonVariant.link}
                  data-test="cancel-visibility-button"
                >
                  Cancel
                </Button>
              </StackItem>
            </Stack>
          </Form>
        );
      }}
    </Formik>
  );
};

export const createEditImageRepositoryVisibilityModal = createModalLauncher(
  EditImageRepositoryVisibilityModal,
  {
    'data-test': 'edit-image-repository-visibility-modal',
    variant: ModalVariant.medium,
    title: 'Edit image repository visibility',
  },
);
