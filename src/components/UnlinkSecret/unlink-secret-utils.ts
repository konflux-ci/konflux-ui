import { ComponentKind, SecretKind } from '~/types';
import { unLinkSecretFromServiceAccount } from '../Secrets/utils/service-account-utils';

export const unlinkSecretFromComponent = (secret: SecretKind, component: ComponentKind) => {
  unLinkSecretFromServiceAccount(secret, component)
    .then()
    .catch((err) => {
      // eslint-disable-next-line no-console
      console.warn(err);
    });
};
