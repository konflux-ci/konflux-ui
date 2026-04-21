import { ModalVariant } from '@patternfly/react-core';
import { SecretFormValues, BuildTimeSecret, CurrentComponentRef, ImportSecret } from '../../types';
import { createRawModalLauncher } from '../modal/createModalLauncher';
import SecretModal from './SecretModal';

export type SecretModalLauncherParams = {
  existingSecrets?: BuildTimeSecret[];
  onSubmit?: (values: SecretFormValues) => void;
  onClose?: () => void;
  currentComponent?: null | CurrentComponentRef;
  /** When set, modal opens in edit mode with these values merged into defaults. */
  initialSecret?: Partial<ImportSecret>;
  isEdit?: boolean;
};

export const SecretModalLauncher = ({
  existingSecrets = [],
  onSubmit,
  onClose,
  currentComponent,
  initialSecret,
  isEdit,
}: SecretModalLauncherParams) =>
  createRawModalLauncher(SecretModal, {
    'data-test': 'create-secret-modal',
    variant: ModalVariant.large,
    hasNoBodyWrapper: true,
    onClose,
  })({ onSubmit, existingSecrets, currentComponent, initialSecret, isEdit });
