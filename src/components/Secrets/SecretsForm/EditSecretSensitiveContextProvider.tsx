import * as React from 'react';
import { FormikProps } from 'formik';
import { AddSecretFormValues, SecretKind } from '~/types';
import {
  SecretEditSensitiveContextValue,
  SecretEditSensitiveProvider,
} from './SecretEditSensitiveContext';

export type EditSecretSensitiveContextProviderProps = React.PropsWithChildren<{
  formik: FormikProps<AddSecretFormValues>;
  fullSecret: SecretKind | null;
  isLoadingFullSecret: boolean;
  requestFullSecret: () => Promise<SecretKind | undefined>;
  clearSensitiveMemory: () => void;
}>;

export const EditSecretSensitiveContextProvider: React.FC<
  EditSecretSensitiveContextProviderProps
> = ({
  formik,
  fullSecret,
  isLoadingFullSecret,
  requestFullSecret,
  clearSensitiveMemory,
  children,
}) => {
  const formikRef = React.useRef(formik);
  formikRef.current = formik;

  const clearFullSecretAndSensitiveFields = React.useCallback(() => {
    clearSensitiveMemory();
    const { setFieldValue, values: v } = formikRef.current;
    void setFieldValue('source.password', '');
    void setFieldValue('source.ssh-privatekey', '');
    void setFieldValue('image.dockerconfig', undefined);
    v.image?.registryCreds?.forEach((_c, idx) => {
      void setFieldValue(`image.registryCreds.${idx}.password`, '');
    });
    v.opaque?.keyValues?.forEach((_kv, idx) => {
      void setFieldValue(`opaque.keyValues.${idx}.value`, '');
    });
  }, [clearSensitiveMemory]);

  React.useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') {
        clearFullSecretAndSensitiveFields();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [clearFullSecretAndSensitiveFields]);

  const contextValue = React.useMemo(
    (): SecretEditSensitiveContextValue => ({
      fullSecret,
      isLoadingFullSecret,
      requestFullSecret,
      clearFullSecretAndSensitiveFields,
    }),
    [fullSecret, isLoadingFullSecret, requestFullSecret, clearFullSecretAndSensitiveFields],
  );

  return <SecretEditSensitiveProvider value={contextValue}>{children}</SecretEditSensitiveProvider>;
};
