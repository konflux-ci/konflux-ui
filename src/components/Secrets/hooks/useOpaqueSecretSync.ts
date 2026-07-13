import { useCallback, useEffect, useRef } from 'react';
import { useFormikContext } from 'formik';
import { SecretFormValues, SecretTypeDropdownLabel, BuildTimeSecret } from '~/types';
import {
  supportedPartnerTasksSecrets,
  findExistingOpaqueSecretByName,
  getSupportedPartnerTaskKeyValuePairs,
  isPartnerTask,
  isUsingExistingClusterSecret,
} from '~/utils/secrets/secret-utils';

const defaultKeyValues = [{ key: '', value: '', readOnlyKey: false }];
const defaultLabels = [{ key: '', value: '' }];
const defaultImageKeyValues = [{ key: '.dockerconfigjson', value: '', readOnlyKey: true }];

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

  const clearReadOnlyKeys = useCallback(() => {
    const newKeyValues = (values.opaque?.keyValues ?? []).filter((kv) => !kv.readOnlyKey);
    void setFieldValue('opaque.keyValues', [
      ...(newKeyValues.length ? newKeyValues : defaultKeyValues),
    ]);
  }, [setFieldValue, values.opaque?.keyValues]);

  const resetOpaqueFields = useCallback(() => {
    void setFieldValue('opaque.keyValues', defaultKeyValues);
    void setFieldValue('labels', defaultLabels);
  }, [setFieldValue]);

  const resetKeyValues = useCallback(() => {
    const newKeyValues = (values.opaque?.keyValues ?? []).filter(
      (kv) => !kv.readOnlyKey && (!!kv.key || !!kv.value),
    );
    void setFieldValue('opaque.keyValues', [...newKeyValues, ...defaultImageKeyValues]);
  }, [setFieldValue, values.opaque?.keyValues]);

  const makeOpaqueFieldsEditable = useCallback(() => {
    void setFieldValue(
      'opaque.keyValues',
      (values.opaque?.keyValues ?? defaultKeyValues).map((kv) => ({
        ...kv,
        readOnlyKey: false,
        readOnlyValue: false,
      })),
    );
  }, [setFieldValue, values.opaque?.keyValues]);

  const populateFromExistingOpaqueSecret = useCallback(
    (secretName: string) => {
      if (isPartnerTask(secretName, supportedPartnerTasksSecrets)) {
        void setFieldValue('opaque.keyValues', [
          ...getSupportedPartnerTaskKeyValuePairs(secretName),
        ]);
        void setFieldValue('labels', defaultLabels);
        return;
      }

      const matched = findExistingOpaqueSecretByName(secretName, existingSecrets);
      if (matched?.opaque?.keyValuePairs) {
        void setFieldValue('opaque.keyValues', matched.opaque.keyValuePairs);
      }
      if (matched?.labels?.length) {
        void setFieldValue('labels', matched.labels);
      } else {
        void setFieldValue('labels', defaultLabels);
      }
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

    const wasUsingExistingCluster = isUsingExistingClusterSecret(
      previousName,
      currentType,
      existingSecrets,
    );
    const isUsingExistingClusterNow = isUsingExistingClusterSecret(
      currentName,
      currentType,
      existingSecrets,
    );

    if (isUsingExistingClusterNow) {
      populateFromExistingOpaqueSecret(currentName);
    } else if (wasUsingExistingCluster) {
      makeOpaqueFieldsEditable();
    } else if (
      isPartnerTask(previousName, supportedPartnerTasksSecrets) &&
      !isPartnerTask(currentName, supportedPartnerTasksSecrets)
    ) {
      resetOpaqueFields();
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
