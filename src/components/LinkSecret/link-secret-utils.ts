import { ComponentKind, SecretKind } from '~/types';
import { linkSecretToServiceAccount } from '../Secrets/utils/service-account-utils';

export const linkSecretsToComponent = (secrets: SecretKind[], component: ComponentKind) => {
  Promise.all(
    secrets.map((item) => {
      return linkSecretToServiceAccount(item, component);
    }),
  )
    .then()
    .catch((err) => {
      // eslint-disable-next-line no-console
      console.warn(err);
    });
};
