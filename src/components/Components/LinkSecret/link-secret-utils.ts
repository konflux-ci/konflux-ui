import { linkSecretsToBuildServiceAccount } from '../../Secrets/utils/service-account-utils';
import { ComponentKind, SecretKind } from '~/types';

export const linkSecretsToComponent = (secrets: SecretKind[], component: ComponentKind) => {
  linkSecretsToBuildServiceAccount(secrets, component)
    .then()
    .catch((err) => {
      // eslint-disable-next-line no-console
      console.warn(err);
    });
};
