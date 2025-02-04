import { ModalVariant } from '@patternfly/react-core';
import { SecretFormValues, BuildTimeSecret } from '../../types';
import { createRawModalLauncher } from '../modal/createModalLauncher';
import SecretForm from './SecretModal';

export const SecretModalLauncher = (
  existingSecrets?: BuildTimeSecret[],
  onSubmit?: (values: SecretFormValues) => void,
  onClose?: () => void,
) =>
  createRawModalLauncher(SecretForm, {
    'data-test': 'create-secret-modal',
    variant: ModalVariant.large,
    hasNoBodyWrapper: true,
    onClose,
  })({ onSubmit, existingSecrets });
