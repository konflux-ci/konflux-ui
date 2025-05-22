import { ComponentKind, SecretKind } from '~/types';
import { linkSecretToBuildServiceAccount } from '../Secrets/utils/service-account-utils';

export const linkSecretsToComponent = (secrets: SecretKind[], component: ComponentKind) => {
  secrets.map((item) => {
    linkSecretToBuildServiceAccount(item, component)
      .then()
      .catch((err) => {
        // eslint-disable-next-line no-console
        console.warn(err);
      });
  });
};
