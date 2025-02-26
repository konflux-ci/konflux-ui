import React from 'react';
import { SelectVariant } from '@patternfly/react-core/deprecated';
import { useFormikContext } from 'formik';
import { InputField } from 'formik-pf';
import { DropdownItemObject } from '../../../shared/components/dropdown';
import KeyValueFileInputField from '../../../shared/components/formik-fields/key-value-input-field/KeyValueInputField';
import SelectInputField from '../../../shared/components/formik-fields/SelectInputField';
import { AddSecretFormValues, SecretFor, SecretTypeDropdownLabel } from '../../../types';
import SecretTypeSelector from '../SecretTypeSelector';
import {
  getSupportedPartnerTaskKeyValuePairs,
  getSupportedPartnerTaskSecrets,
  isPartnerTask,
  isPartnerTaskAvailable,
} from '../utils/secret-utils';
import { ImagePullSecretForm } from './ImagePullSecretForm';
import { KeyValueSecretForm } from './KeyValueSecretForm';
import { SourceSecretForm } from './SourceSecretForm';
import './SecretTypeSubForm.scss';

const secretTypes = [
  {
    key: 'key-value',
    label: SecretTypeDropdownLabel.opaque,
    targets: [SecretFor.Build, SecretFor.Deployment],
    component: <KeyValueSecretForm />,
  },
  {
    key: 'image-pull',
    label: SecretTypeDropdownLabel.image,
    targets: [SecretFor.Build],
    component: <ImagePullSecretForm />,
  },
  {
    key: 'source',
    label: SecretTypeDropdownLabel.source,
    targets: [SecretFor.Build],
    component: <SourceSecretForm />,
  },
];

const supportedPartnerTaskSecrets = getSupportedPartnerTaskSecrets();
const defaultKeyValues = [{ key: '', value: '' }];

export const SecretTypeSubForm: React.FC<React.PropsWithChildren<unknown>> = () => {
  const {
    values: {
      name,
      type: secretType,
      secretFor,
      opaque: { keyValues },
    },
    setFieldValue,
    validateForm,
  } = useFormikContext<AddSecretFormValues>();

  const existingSecrets = [];

  const initialOptions = supportedPartnerTaskSecrets.filter(
    (secret) => !existingSecrets.includes(secret.value),
  );

  const [options, setOptions] = React.useState(initialOptions);
  const currentTypeRef = React.useRef(secretType);

  const selectedForm = React.useMemo(
    () => secretTypes.find((t) => t.label === secretType),
    [secretType],
  );

  const clearKeyValues = React.useCallback(() => {
    const newKeyValues = keyValues.filter((kv) => !kv.readOnlyKey);
    void setFieldValue('opaque.keyValues', [
      ...(newKeyValues.length ? newKeyValues : defaultKeyValues),
    ]);
  }, [keyValues, setFieldValue]);

  const resetKeyValues = () => {
    setOptions([]);
    const newKeyValues = keyValues.filter((kv) => !kv.readOnlyKey && (!!kv.key || !!kv.value));
    void setFieldValue('opaque.keyValues', [...newKeyValues]);
  };

  const availableTypes = React.useMemo(
    () => secretTypes.filter((t) => t.targets.includes(secretFor)).map((t) => t.label),
    [secretFor],
  );
  const dropdownItems: DropdownItemObject[] = Object.entries(SecretTypeDropdownLabel).reduce(
    (acc, [key, value]) => {
      if (availableTypes.includes(value)) {
        acc.push({ key, value });
      }
      return acc;
    },
    [],
  );

  return (
    <>
      <SecretTypeSelector
        key={secretFor}
        dropdownItems={dropdownItems}
        isDisabled={secretFor === SecretFor.Deployment}
        onChange={(type) => {
          setTimeout(() => validateForm());
          currentTypeRef.current = type;
          if (type !== SecretTypeDropdownLabel.opaque) {
            resetKeyValues();
            name && isPartnerTask(name) && void setFieldValue('name', '');
          } else {
            setOptions(initialOptions);
            clearKeyValues();
          }
        }}
      />
      {isPartnerTaskAvailable(currentTypeRef.current) ? (
        <SelectInputField
          name="name"
          data-test="secret-name"
          label="Select or enter secret name"
          toggleAriaLabel="Select or enter secret name"
          helpText="Unique name of the new secret"
          toggleId="secret-name-toggle"
          variant={SelectVariant.typeahead}
          options={options}
          isCreatable
          className="secret-type-subform__dropdown"
          isInputValuePersisted
          hasOnCreateOption
          required
          onSelect={(_e, value: string) => {
            if (isPartnerTask(value)) {
              void setFieldValue('opaque.keyValues', [
                ...keyValues.filter((kv) => !kv.readOnlyKey && (!!kv.key || !!kv.value)),
                ...getSupportedPartnerTaskKeyValuePairs(value),
              ]);
            }
          }}
          onClear={() => {
            if (isPartnerTask(name)) {
              clearKeyValues();
            }
          }}
        />
      ) : (
        <InputField
          name="name"
          data-test="secret-name"
          label="Secret name"
          helperText="Unique name of the new secret"
          placeholder="Enter name"
          required
        />
      )}

      {selectedForm && selectedForm.component}
      <KeyValueFileInputField
        name="labels"
        label="Labels"
        entries={[{ key: '', value: '' }]}
        description="You can add labels to provide more context or tag your secret."
      />
    </>
  );
};
