import React from 'react';
import { TextInputTypes } from '@patternfly/react-core';
import { useField } from 'formik';
import { InputField } from 'formik-pf';
import DropdownField from '~/shared/components/formik-fields/DropdownField';
import { SourceSecretType } from '~/types/secret';
import EncodedFileUploadField from './EncodedFileUploadField';

type SourceSecretFormProps = {
  onAuthTypeChange?: (type: SourceSecretType) => void;
  isEditMode?: boolean;
};

export const SourceSecretForm: React.FC<SourceSecretFormProps> = ({
  onAuthTypeChange,
  isEditMode = false,
}) => {
  const [{ value: type }] = useField<SourceSecretType>('source.authType');

  React.useEffect(() => {
    onAuthTypeChange?.(type);
  }, [type, onAuthTypeChange]);

  return (
    <>
      <DropdownField
        name="source.authType"
        label="Authentication type"
        helpText="Select how you want to authenticate"
        items={[
          { key: 'basic', value: SourceSecretType.basic },
          { key: 'ssh', value: SourceSecretType.ssh },
        ]}
        required
        className="secret-type-subform__dropdown"
      />
      <InputField name="source.host" label="Host" helperText="Host for the secret" />
      <InputField name="source.repo" label="Repository" helperText="Repository for the secret" />
      {type === SourceSecretType.basic ? (
        <>
          <InputField
            name="source.username"
            data-test="secret-source-username"
            label="Username"
            helperText="For Git authentication"
          />
          <InputField
            name="source.password"
            data-test="secret-source-password"
            label="Password"
            type={TextInputTypes.password}
            helperText="For Git authentication"
            isRequired
          />
        </>
      ) : (
        <EncodedFileUploadField
          name="source.ssh-privatekey"
          id="text-file-ssh"
          label="SSH private key"
          helpText={
            isEditMode
              ? 'If you want to keep the same SSH private key, leave this field blank'
              : 'For Git authentication'
          }
          required
        />
      )}
    </>
  );
};
export { SourceSecretType };
