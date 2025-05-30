import { ComponentKind, SecretKind } from '~/types';
import { unLinkSecretFromBuildServiceAccount } from '../Secrets/utils/service-account-utils';

export const unlinkSecretFromComponent = (secret: SecretKind, component: ComponentKind) => {
  unLinkSecretFromBuildServiceAccount(secret, component)
    .then()
    .catch((err) => {
      // eslint-disable-next-line no-console
      console.warn(err);
    });
};
