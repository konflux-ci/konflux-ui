import { previewMode } from '~/consts/featureflag';
import { SecretModel } from '../../models';
import { SecretKind } from '../../types';
import { createDeleteModalLauncher } from '../modal/DeleteResourceModal';
import {
  unlinkSecretFromComponentServiceAccounts,
  unLinkSecretFromServiceAccount,
} from './utils/service-account-utils';

export const secretDeleteModal = (secret: SecretKind) =>
  createDeleteModalLauncher(secret.kind)({
    obj: secret,
    model: SecretModel,
    submitCallback: previewMode
      ? unLinkSecretFromServiceAccount
      : unlinkSecretFromComponentServiceAccounts,
    displayName: secret.metadata.name,
    description: (
      <>
        The secret <strong>{secret.metadata.name}</strong> and its value will be deleted from all
        the environments it is attached to.
      </>
    ),
  });
