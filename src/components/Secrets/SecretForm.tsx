import React, { useMemo, useState } from 'react';
import { Form } from '@patternfly/react-core';
import { useField, useFormikContext } from 'formik';
<<<<<<< HEAD
import { FIELD_SECRET_FOR_COMPONENT_OPTION, SecretLinkOptionLabels } from '~/consts/secrets';
import { InputField } from '~/shared/components/formik-base';
=======
import { InputField } from 'formik-pf';
import { FIELD_SECRET_FOR_COMPONENT_OPTION, SecretLinkOptionLabels, DEFAULT_OPAQUE_KEY_VALUES, DEFAULT_OPAQUE_LABELS } from '~/consts/secrets';
>>>>>>> 83da231a (refactor: extract opaque secret sync helpers and shared defaults)
import KeyValueInputField from '~/shared/components/formik-fields/key-value-input-field/KeyValueInputField';
import {
  supportedPartnerTasksSecrets,
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
import { useOpaqueSecretSync } from './hooks/useOpaqueSecretSync';
import { ImagePullSecretForm } from './SecretsForm/ImagePullSecretForm';
import { SecretLinkOptions } from './SecretsForm/SecretLinkOption';
import { SourceSecretForm } from './SecretsForm/SourceSecretForm';
import SecretTypeSelector from './SecretTypeSelector';

type SecretFormProps = RawComponentProps & {
  existingSecrets: BuildTimeSecret[];
  currentComponent?: null | CurrentComponentRef;
  isEdit?: boolean;
};

const SecretForm: React.FC<React.PropsWithChildren<SecretFormProps>> = ({
  existingSecrets,
  currentComponent,
  isEdit = false,
}) => {
  const { values, setFieldValue } = useFormikContext<SecretFormValues>();
  const [currentType, setCurrentType] = useState(values.type);

  const [{ value: secretForComponentOption }, , { setValue }] = useField<SecretForComponentOption>(
    FIELD_SECRET_FOR_COMPONENT_OPTION,
  );

  const { clearReadOnlyKeys, resetOpaqueFields, resetKeyValues, populateFromExistingOpaqueSecret } =
    useOpaqueSecretSync({
      currentType,
      existingSecrets,
    });

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

  const optionsValues = useMemo((): Record<string, BuildTimeSecret> => {
    return existingSecrets
      .filter((secret) => secret.type === K8sSecretType[currentType])
      .filter((secret) => secret.type !== K8sSecretType[SecretTypeDropdownLabel.image])
      .reduce<Record<string, BuildTimeSecret>>(
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
    : isUsingExisting
      ? 'Reusing an existing cluster secret.'
      : 'Unique name of the new secret.';

  return (
    <Form data-test="secret-form">
      <SecretTypeSelector
        dropdownItems={dropdownItems}
        isDisabled={isEdit}
        isEditMode={isEdit}
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
            clearReadOnlyKeys();
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
          entries={DEFAULT_OPAQUE_KEY_VALUES}
          disableRemoveAction={(values.opaque?.keyValues?.length ?? 1) === 1 || isUsingExisting}
          disableAddAction={isUsingExisting}
        />
      )}

      <KeyValueInputField
        name="labels"
        label="Labels"
        entries={values.labels?.length ? values.labels : DEFAULT_OPAQUE_LABELS}
        readOnly={isUsingExisting}
        description="You can add labels to provide more context or tag your secret."
      />
    </Form>
  );
};

export default SecretForm;
