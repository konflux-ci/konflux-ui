import React, { useMemo, useState } from 'react';
import { Form } from '@patternfly/react-core';
import { SelectVariant } from '@patternfly/react-core/deprecated';
import { useField, useFormikContext } from 'formik';
import { FIELD_SECRET_FOR_COMPONENT_OPTION, SecretLinkOptionLabels } from '~/consts/secrets';
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
import {
  supportedPartnerTasksSecrets,
  getSupportedPartnerTaskKeyValuePairs,
  isPartnerTask,
  SecretForComponentOption,
} from './utils/secret-utils';

type SecretFormProps = RawComponentProps & {
  existingSecrets: BuildTimeSecret[];
  currentComponent?: null | CurrentComponentRef;
};

const SecretForm: React.FC<React.PropsWithChildren<SecretFormProps>> = ({
  existingSecrets,
  currentComponent,
}) => {
  const { values, setFieldValue } = useFormikContext<SecretFormValues>();
  const [currentType, setCurrentType] = useState(values.type);
  const defaultKeyValues = [{ key: '', value: '', readOnlyKey: false }];
  const defaultImageKeyValues = [{ key: '.dockerconfigjson', value: '', readOnlyKey: true }];
  const [{ value: secretForComponentOption }, , { setValue }] = useField<SecretForComponentOption>(
    FIELD_SECRET_FOR_COMPONENT_OPTION,
  );

  let options = useMemo(() => {
    return existingSecrets
      .filter((secret) => secret.type === K8sSecretType[currentType])
      .concat(
        currentType === SecretTypeDropdownLabel.opaque &&
          existingSecrets.find((s) => s.name === 'snyk-secret') === undefined
          ? [supportedPartnerTasksSecrets.snyk]
          : [],
      )
      .filter((secret) => secret.type !== K8sSecretType[SecretTypeDropdownLabel.image])
      .map((secret) => ({ value: secret.name, lable: secret.name }));
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

  const clearKeyValues = () => {
    const newKeyValues = values.opaque.keyValues.filter((kv) => !kv.readOnlyKey);
    void setFieldValue('keyValues', [...(newKeyValues.length ? newKeyValues : defaultKeyValues)]);
  };

  const resetKeyValues = () => {
    options = [];
    const newKeyValues = values.opaque.keyValues.filter(
      (kv) => !kv.readOnlyKey && (!!kv.key || !!kv.value),
    );
    void setFieldValue('keyValues', [...newKeyValues, ...defaultImageKeyValues]);
  };

  const dropdownItems: DropdownItemObject[] = Object.entries(SecretTypeDropdownLabel).reduce(
    (acc, [key, value]) => {
      acc.push({ key, value });
      return acc;
    },
    [],
  );

  const shouldShowSecretLinkOptions =
    (values?.source?.authType === SourceSecretType.basic &&
      currentType === SecretTypeDropdownLabel.source) ||
    currentType === SecretTypeDropdownLabel.image;

  return (
    <Form data-test="secret-form">
      <SecretTypeSelector
        dropdownItems={dropdownItems}
        onChange={(type) => {
          setCurrentType(type);
          void setValue(null);
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
      <SelectInputField
        required
        key={values.type}
        data-test="secret-name"
        name="secretName"
        label="Select or enter secret name"
        helpText="Unique name of the new secret."
        isCreatable
        isInputValuePersisted
        hasOnCreateOption
        options={options}
        variant={SelectVariant.typeahead}
        toggleId="secret-name-toggle"
        toggleAriaLabel="secret-name-dropdown"
        onClear={() => {
          if (currentType !== values.type || isPartnerTask(values.secretName, optionsValues)) {
            clearKeyValues();
          }
        }}
        onSelect={(_, value: string) => {
          if (isPartnerTask(value, optionsValues)) {
            void setFieldValue('opaque.keyValues', [
              ...values.opaque.keyValues.filter(
                (kv) => !kv.readOnlyKey && (!!kv.key || !!kv.value),
              ),
              ...getSupportedPartnerTaskKeyValuePairs(value, optionsValues),
            ]);
          }
          void setFieldValue('secretName', value);
        }}
      />
      {shouldShowSecretLinkOptions && (
        <SecretLinkOptions
          currentComponent={currentComponent}
          secretForComponentOption={secretForComponentOption}
          onOptionChange={(option) => setValue(option)}
          radioLabels={SecretLinkOptionLabels.forImportSecret}
        />
      )}
      {currentType === SecretTypeDropdownLabel.source && <SourceSecretForm />}
      {currentType === SecretTypeDropdownLabel.image && <ImagePullSecretForm />}
      {currentType === SecretTypeDropdownLabel.opaque && (
        <KeyValueFileInputField
          required
          name={'opaque.keyValues'}
          entries={defaultKeyValues}
          disableRemoveAction={values.opaque.keyValues.length === 1}
        />
      )}
    </Form>
  );
};

export default SecretForm;
