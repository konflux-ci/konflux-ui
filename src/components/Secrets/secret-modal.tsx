import { SecretModel } from '~/models';
import { SecretKind, SecretTypeDisplayLabel } from '~/types';
import { createDeleteModalLauncher } from '../modal/DeleteResourceModal';
import { typeToLabel } from './utils/secret-utils';
import {
  unLinkSecretFromServiceAccount,
  unlinkSecretFromServiceAccounts,
} from './utils/service-account-utils';

export const secretDeleteModal = (secret: SecretKind, isFeatureFlagEnabled: boolean) => {
  const submitCallback = isFeatureFlagEnabled
    ? unlinkSecretFromServiceAccounts
    : typeToLabel(secret.type) === SecretTypeDisplayLabel.imagePull
      ? unLinkSecretFromServiceAccount
      : null;

  return createDeleteModalLauncher(secret.kind)({
    obj: secret,
    model: SecretModel,
    submitCallback,
    displayName: secret.metadata.name,
    description: (
      <>
        The secret <strong>{secret.metadata.name}</strong> and its value will be deleted from all
        the environments it is attached to.
      </>
    ),
  });
};
