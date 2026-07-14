import { useCallback, useEffect, useRef } from 'react';
import { useFormikContext } from 'formik';
import { DEFAULT_OPAQUE_KEY_VALUES, DEFAULT_OPAQUE_LABELS } from '~/consts/secrets';
import { SecretFormValues, SecretTypeDropdownLabel, BuildTimeSecret } from '~/types';
import {
  getEditableKeyValues,
  getKeyValuesWithoutReadOnlyKeys,
  getOpaqueFieldsFromExistingSecret,
  getOpaqueSecretSyncTransition,
  getResetKeyValuesForImage,
} from './opaqueSecretSyncUtils';

interface UseOpaqueSecretSyncOptions {
  currentType: string;
  existingSecrets: BuildTimeSecret[];
}

export const useOpaqueSecretSync = ({
  currentType,
  existingSecrets,
}: UseOpaqueSecretSyncOptions) => {
  const { values, setFieldValue } = useFormikContext<SecretFormValues>();
  const previousSecretNameRef = useRef(values.secretName);
  const opaqueKeyValuesRef = useRef(values.opaque?.keyValues ?? []);
  opaqueKeyValuesRef.current = values.opaque?.keyValues ?? [];

  const clearReadOnlyKeys = useCallback(() => {
    void setFieldValue(
      'opaque.keyValues',
      getKeyValuesWithoutReadOnlyKeys(opaqueKeyValuesRef.current),
    );
  }, [setFieldValue]);

  const resetOpaqueFields = useCallback(() => {
    void setFieldValue('opaque.keyValues', DEFAULT_OPAQUE_KEY_VALUES);
    void setFieldValue('labels', DEFAULT_OPAQUE_LABELS);
  }, [setFieldValue]);

  const resetKeyValues = useCallback(() => {
    void setFieldValue(
      'opaque.keyValues',
      getResetKeyValuesForImage(opaqueKeyValuesRef.current),
    );
  }, [setFieldValue]);

  const makeOpaqueFieldsEditable = useCallback(() => {
    void setFieldValue('opaque.keyValues', getEditableKeyValues(opaqueKeyValuesRef.current));
  }, [setFieldValue]);

  const populateFromExistingOpaqueSecret = useCallback(
    (secretName: string) => {
      const { keyValues, labels } = getOpaqueFieldsFromExistingSecret(secretName, existingSecrets);

      if (keyValues) {
        void setFieldValue('opaque.keyValues', keyValues);
      }
      void setFieldValue('labels', labels);
    },
    [existingSecrets, setFieldValue],
  );

  useEffect(() => {
    if (currentType !== SecretTypeDropdownLabel.opaque) {
      previousSecretNameRef.current = values.secretName;
      return;
    }

    const previousName = previousSecretNameRef.current;
    const currentName = values.secretName;

    if (previousName === currentName) {
      return;
    }

    const transition = getOpaqueSecretSyncTransition({
      previousName,
      currentName,
      currentType,
      existingSecrets,
    });

    switch (transition.action) {
      case 'populateFromExisting':
        populateFromExistingOpaqueSecret(transition.secretName);
        break;
      case 'makeEditable':
        makeOpaqueFieldsEditable();
        break;
      case 'resetOpaque':
        resetOpaqueFields();
        break;
      case 'none':
        break;
      default:
        break;
    }

    previousSecretNameRef.current = currentName;
  }, [
    values.secretName,
    currentType,
    existingSecrets,
    resetOpaqueFields,
    makeOpaqueFieldsEditable,
    populateFromExistingOpaqueSecret,
  ]);

  return {
    clearReadOnlyKeys,
    resetOpaqueFields,
    resetKeyValues,
    populateFromExistingOpaqueSecret,
  };
};
