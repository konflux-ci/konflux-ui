import React from 'react';
import { useField, useFormikContext } from 'formik';
import { InputField } from 'formik-pf';
import DropdownField from '~/shared/components/formik-fields/DropdownField';
import { SourceSecretType } from '~/types/secret';
import EncodedFileUploadField from './EncodedFileUploadField';
import {
  useAreSecretSensitiveFieldsHidden,
  useOptionalSecretEditSensitive,
} from './SecretEditSensitiveContext';
import { SecretPasswordInputField } from './SecretPasswordInputField';
import { SensitiveValuesRevealBanner } from './SensitiveValuesRevealBanner';

type SourceSecretFormProps = {
  onAuthTypeChange?: (type: SourceSecretType) => void;
  isEditMode?: boolean;
};

export const SourceSecretForm: React.FC<SourceSecretFormProps> = ({
  onAuthTypeChange,
  isEditMode = false,
}) => {
  const [{ value: type }] = useField<SourceSecretType>('source.authType');
  const { setFieldValue } = useFormikContext();
  const sensitive = useOptionalSecretEditSensitive();
  const sensitiveFieldsHidden = useAreSecretSensitiveFieldsHidden();

  React.useEffect(() => {
    onAuthTypeChange?.(type);
  }, [type, onAuthTypeChange]);

  const revealBasicAuthValues = React.useCallback(async () => {
    if (!sensitive) {
      return;
    }
    const s = await sensitive.requestFullSecret();
    if (!s?.data) {
      return;
    }
    if (s.data.username) {
      void setFieldValue('source.username', atob(s.data.username));
    }
    if (s.data.password) {
      void setFieldValue('source.password', atob(s.data.password));
    }
  }, [sensitive, setFieldValue]);

  const revealSshKey = React.useCallback(async () => {
    if (!sensitive) {
      return;
    }
    const s = await sensitive.requestFullSecret();
    const key = s?.data?.['ssh-privatekey'];
    if (key) {
      void setFieldValue('source.ssh-privatekey', key);
    }
  }, [sensitive, setFieldValue]);

  return (
    <>
      <DropdownField
        name="source.authType"
        label="Authentication type"
        helpText={
          isEditMode
            ? 'You cannot edit the authentication type in edit mode'
            : 'Select how you want to authenticate'
        }
        items={[
          { key: 'basic', value: SourceSecretType.basic },
          { key: 'ssh', value: SourceSecretType.ssh },
        ]}
        isDisabled={isEditMode}
        required={!isEditMode}
        className="secret-type-subform__dropdown"
      />
      <InputField name="source.host" label="Host" helperText="Host for the secret" />
      <InputField name="source.repo" label="Repository" helperText="Repository for the secret" />
      {type === SourceSecretType.basic ? (
        <>
          <SensitiveValuesRevealBanner onReveal={revealBasicAuthValues} />
          {!sensitiveFieldsHidden ? (
            <>
              <InputField
                name="source.username"
                data-test="secret-source-username"
                label="Username"
                helperText="For Git authentication"
              />
              <SecretPasswordInputField
                name="source.password"
                label="Password"
                helperText="For Git authentication"
                placeholder={isEditMode ? 'To keep the same password, leave this field blank' : ''}
                required={!isEditMode}
              />
            </>
          ) : null}
        </>
      ) : (
        <>
          <SensitiveValuesRevealBanner onReveal={revealSshKey} />
          {!sensitiveFieldsHidden ? (
            <EncodedFileUploadField
              name="source.ssh-privatekey"
              id="text-file-ssh"
              label="SSH private key"
              helpText={
                isEditMode
                  ? 'If you want to keep the same SSH private key, leave this field blank'
                  : 'For Git authentication'
              }
              required={!isEditMode}
            />
          ) : null}
        </>
      )}
    </>
  );
};
export { SourceSecretType };
