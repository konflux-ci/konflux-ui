import { SecretModel } from '~/models';
import { SecretKind } from '~/types';
import { createDeleteModalLauncher } from '../modal/DeleteResourceModal';
import { unlinkSecretFromServiceAccounts } from './utils/service-account-utils';

export const secretDeleteModal = (secret: SecretKind) => {
  return createDeleteModalLauncher(secret.kind)({
    obj: secret,
    model: SecretModel,
    submitCallback: unlinkSecretFromServiceAccounts,
    displayName: secret.metadata.name,
    description: (
      <>
        The secret <strong>{secret.metadata.name}</strong> and its value will be deleted from all
        the environments it is attached to.
      </>
    ),
  });
};
