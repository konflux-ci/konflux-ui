import * as React from 'react';
import { SecretKind } from '~/types';

export type SecretEditSensitiveContextValue = {
  /** Loads full Secret into parent state (not React Query). Resolves with Secret or undefined on failure. */
  requestFullSecret: () => Promise<SecretKind | undefined>;
  /** Drops full secret from memory and clears sensitive Formik fields. */
  clearFullSecretAndSensitiveFields: () => void;
  /** Call when a sensitive control loses focus (clears value + may drop full secret). */
  onSensitiveFieldBlur: (fieldPath: string) => void;
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
