import { ModalVariant } from '@patternfly/react-core';
import { SecretFormValues, BuildTimeSecret, CurrentComponentRef } from '../../types';
import { createRawModalLauncher } from '../modal/createModalLauncher';
import SecretForm from './SecretModal';

export const SecretModalLauncher = (
  existingSecrets?: BuildTimeSecret[],
  onSubmit?: (values: SecretFormValues) => void,
  onClose?: () => void,
  currentComponent?: null | CurrentComponentRef,
) =>
  createRawModalLauncher(SecretForm, {
    'data-test': 'create-secret-modal',
    variant: ModalVariant.large,
    hasNoBodyWrapper: true,
    onClose,
  })({ onSubmit, existingSecrets, currentComponent });
