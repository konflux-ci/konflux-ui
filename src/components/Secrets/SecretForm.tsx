import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Form } from '@patternfly/react-core';
import { useField, useFormikContext } from 'formik';
import { FIELD_SECRET_FOR_COMPONENT_OPTION, SecretLinkOptionLabels } from '~/consts/secrets';
import { InputField } from '~/shared/components/formik-base';
import KeyValueInputField from '~/shared/components/formik-fields/key-value-input-field/KeyValueInputField';
import {
  supportedPartnerTasksSecrets,
  findExistingOpaqueSecretByName,
  getSupportedPartnerTaskKeyValuePairs,
  isPartnerTask,
  isUsingExistingClusterSecret,
  SecretForComponentOption,
} from '~/utils/secrets/secret-utils';
import { DropdownItemObject } from '../../shared/components/dropdown';
import KeyValueFileInputField from '../../shared/components/formik-fields/key-value-file-input-field/KeyValueFileInputField';
import SelectInputField from '../../shared/components/formik-fields/SelectInputField';
import {
  SecretFormValues,
  SecretTypeDropdownLabel,
  K8sSecretType,
  BuildTimeSecret,
  SourceSecretType,
  CurrentComponentRef,
} from '../../types';
import { RawComponentProps } from '../modal/createModalLauncher';
import { ImagePullSecretForm } from './SecretsForm/ImagePullSecretForm';
import { SecretLinkOptions } from './SecretsForm/SecretLinkOption';
import { SourceSecretForm } from './SecretsForm/SourceSecretForm';
import SecretTypeSelector from './SecretTypeSelector';

type SecretFormProps = RawComponentProps & {
  existingSecrets: BuildTimeSecret[];
  currentComponent?: null | CurrentComponentRef;
  isEdit?: boolean;
};

const defaultKeyValues = [{ key: '', value: '', readOnlyKey: false }];
const defaultLabels = [{ key: '', value: '' }];
const defaultImageKeyValues = [{ key: '.dockerconfigjson', value: '', readOnlyKey: true }];

const SecretForm: React.FC<React.PropsWithChildren<SecretFormProps>> = ({
  existingSecrets,
  currentComponent,
  isEdit = false,
}) => {
  const { values, setFieldValue } = useFormikContext<SecretFormValues>();
  const [currentType, setCurrentType] = useState(values.type);
  const previousSecretNameRef = useRef(values.secretName);

  const [{ value: secretForComponentOption }, , { setValue }] = useField<SecretForComponentOption>(
    FIELD_SECRET_FOR_COMPONENT_OPTION,
  );

  const options = useMemo(() => {
    return existingSecrets
      .filter((secret) => secret.type === K8sSecretType[currentType])
      .concat(
        currentType === SecretTypeDropdownLabel.opaque &&
          existingSecrets.find((s) => s.name === 'snyk-secret') === undefined
          ? [supportedPartnerTasksSecrets.snyk]
          : [],
      )
      .filter((secret) => secret.type !== K8sSecretType[SecretTypeDropdownLabel.image])
      .map((secret) => ({ value: secret.name }));
  }, [currentType, existingSecrets]);

  const optionsValues = useMemo(() => {
    return existingSecrets
      .filter((secret) => secret.type === K8sSecretType[currentType])
      .filter((secret) => secret.type !== K8sSecretType[SecretTypeDropdownLabel.image])
      .reduce(
        (dictOfSecrets, secret) => {
          dictOfSecrets[secret.name] = secret;
          return dictOfSecrets;
        },
        { 'snyk-secret': supportedPartnerTasksSecrets.snyk },
      );
  }, [currentType, existingSecrets]);

  const isUsingExisting = isUsingExistingClusterSecret(
    values.secretName,
    currentType,
    existingSecrets,
  );

  const isOpaqueNameSelection =
    isPartnerTask(values.secretName, supportedPartnerTasksSecrets) || isUsingExisting;

  const clearKeyValues = () => {
    const newKeyValues = (values.opaque?.keyValues ?? []).filter((kv) => !kv.readOnlyKey);
    void setFieldValue('opaque.keyValues', [
      ...(newKeyValues.length ? newKeyValues : defaultKeyValues),
    ]);
  };

  const resetOpaqueFields = useCallback(() => {
    void setFieldValue('opaque.keyValues', defaultKeyValues);
    void setFieldValue('labels', defaultLabels);
  }, [setFieldValue]);

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

  const resetKeyValues = () => {
    const newKeyValues = (values.opaque?.keyValues ?? []).filter(
      (kv) => !kv.readOnlyKey && (!!kv.key || !!kv.value),
    );
    void setFieldValue('opaque.keyValues', [...newKeyValues, ...defaultImageKeyValues]);
  };

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

  const dropdownItems: DropdownItemObject[] = Object.entries(SecretTypeDropdownLabel).reduce(
    (acc, [key, value]) => {
      acc.push({ key, value });
      return acc;
    },
    [],
  );

  const shouldShowSecretLinkOptions =
    !isUsingExisting &&
    ((values?.source?.authType === SourceSecretType.basic &&
      currentType === SecretTypeDropdownLabel.source) ||
      currentType === SecretTypeDropdownLabel.image);

  const secretNameHelperText = isEdit
    ? 'You cannot edit the existing secret name'
    : 'Unique name of the new secret.';

  return (
    <Form data-test="secret-form">
      <SecretTypeSelector
        dropdownItems={dropdownItems}
        isDisabled={isEdit}
        onChange={(type) => {
          setCurrentType(type);
          void setValue(SecretForComponentOption.none);
          if (type === SecretTypeDropdownLabel.image) {
            resetKeyValues();
            values.secretName &&
              isPartnerTask(values.secretName, optionsValues) &&
              void setFieldValue('secretName', '');
          }
          if (type === SecretTypeDropdownLabel.source) {
            resetKeyValues();
            values.secretName &&
              isPartnerTask(values.secretName) &&
              void setFieldValue('secretName', '');
          } else {
            clearKeyValues();
          }
        }}
      />
      {currentType === SecretTypeDropdownLabel.opaque ? (
        <SelectInputField
          required
          key={values.type}
          name="secretName"
          label="Select or enter secret name"
          helpText={secretNameHelperText}
          isCreatable
          hasOnCreateOption
          isDisabled={isEdit}
          options={options}
          variant="typeahead"
          toggleId="secret-name-toggle"
          toggleAriaLabel="secret-name-dropdown"
          onClear={() => {
            if (currentType !== values.type || isOpaqueNameSelection) {
              resetOpaqueFields();
            }
          }}
          onSelect={(_, value: string) => {
            if (
              isPartnerTask(value, supportedPartnerTasksSecrets) ||
              isUsingExistingClusterSecret(value, currentType, existingSecrets)
            ) {
              populateFromExistingOpaqueSecret(value);
            }
            void setFieldValue('secretName', value);
          }}
        />
      ) : (
        <InputField
          name="secretName"
          data-test="secret-name"
          label="Secret name"
          helperText={secretNameHelperText}
          placeholder="Enter name"
          isDisabled={isEdit}
          isRequired
        />
      )}
      {shouldShowSecretLinkOptions && (
        <SecretLinkOptions
          currentComponent={currentComponent}
          secretForComponentOption={secretForComponentOption}
          onOptionChange={(option) => setValue(option)}
          radioLabels={SecretLinkOptionLabels.default}
        />
      )}
      {currentType === SecretTypeDropdownLabel.source && <SourceSecretForm isEditMode={isEdit} />}
      {currentType === SecretTypeDropdownLabel.image && <ImagePullSecretForm />}
      {currentType === SecretTypeDropdownLabel.opaque && (
        <KeyValueFileInputField
          required={!isUsingExisting}
          name={'opaque.keyValues'}
          entries={defaultKeyValues}
          disableRemoveAction={(values.opaque.keyValues.length ?? 1) === 1 || isUsingExisting}
        />
      )}

      <KeyValueInputField
        name="labels"
        label="Labels"
        entries={values.labels?.length ? values.labels : defaultLabels}
        readOnly={isUsingExisting}
        description="You can add labels to provide more context or tag your secret."
      />
    </Form>
  );
};

export default SecretForm;
