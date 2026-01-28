import { ComponentKind, SecretKind } from '~/types';
import { linkSecretsToBuildServiceAccount } from '../../../utils/service-account/service-account-utils';

export const linkSecretsToComponent = (secrets: SecretKind[], component: ComponentKind) => {
  linkSecretsToBuildServiceAccount(secrets, component)
    .then()
    .catch((err) => {
      // eslint-disable-next-line no-console
      console.warn(err);
    });
};
