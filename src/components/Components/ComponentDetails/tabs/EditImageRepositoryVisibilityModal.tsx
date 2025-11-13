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
  const [error, setError] = React.useState<string>();

  const currentVisibility =
    imageRepository?.spec?.image?.visibility || ImageRepositoryVisibility.public;

  const onSubmit = async (values: { isPrivate: boolean }) => {
    try {
      await updateImageRepositoryVisibility(imageRepository, values.isPrivate);
      onClose(null, { submitClicked: true });
    } catch (e) {
      setError((e.message || e.toString()) as string);
    }
  };

  const onReset = () => {
    onClose(null, { submitClicked: false });
  };

  const currentIsPrivate = currentVisibility === ImageRepositoryVisibility.private;

  return (
    <Formik onSubmit={onSubmit} initialValues={{ isPrivate: currentIsPrivate }} onReset={onReset}>
      {({ handleSubmit, handleReset, isSubmitting, values, setFieldValue }) => {
        const isChanged = values.isPrivate !== currentIsPrivate;

        return (
          <Form data-test="edit-image-repository-visibility-modal">
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

              {error && (
                <StackItem>
                  <Alert
                    isInline
                    variant={AlertVariant.danger}
                    title="An error occurred"
                    data-test="error-alert"
                  >
                    {error}
                  </Alert>
                </StackItem>
              )}

              <StackItem>
                <Button
                  type={ButtonType.submit}
                  isLoading={isSubmitting}
                  onClick={(e) => {
                    e.preventDefault();
                    handleSubmit();
                  }}
                  isDisabled={!isChanged || isSubmitting}
                  data-test="save-visibility-button"
                >
                  Save
                </Button>
                <Button
                  variant={ButtonVariant.link}
                  onClick={handleReset}
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
