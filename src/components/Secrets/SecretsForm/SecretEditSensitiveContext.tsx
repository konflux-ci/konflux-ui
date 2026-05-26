import * as React from 'react';
import { SecretKind } from '~/types';

export type SecretEditSensitiveContextValue = {
  /** Loads full Secret into parent state (not React Query). Resolves with Secret or undefined on failure. */
  requestFullSecret: () => Promise<SecretKind | undefined>;
  /** Drops full secret from memory and clears sensitive Formik fields. */
  clearFullSecretAndSensitiveFields: () => void;
  fullSecret: SecretKind | null;
  isLoadingFullSecret: boolean;
};

const SecretEditSensitiveContext = React.createContext<SecretEditSensitiveContextValue | null>(
  null,
);

export const SecretEditSensitiveProvider: React.FC<
  React.PropsWithChildren<{ value: SecretEditSensitiveContextValue }>
> = ({ children, value }) => (
  <SecretEditSensitiveContext.Provider value={value}>
    {children}
  </SecretEditSensitiveContext.Provider>
);

export const useOptionalSecretEditSensitive = (): SecretEditSensitiveContextValue | null =>
  React.useContext(SecretEditSensitiveContext);

export const useAreSecretSensitiveFieldsHidden = (): boolean => {
  const sensitive = useOptionalSecretEditSensitive();
  return sensitive !== null && sensitive.fullSecret === null;
};
