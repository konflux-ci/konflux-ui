import React from 'react';
import { TextInputTypes } from '@patternfly/react-core';
import { useField } from 'formik';
import { InputField } from 'formik-pf';
import DropdownField from '../../../shared/components/formik-fields/DropdownField';
import { SourceSecretType } from '../../../types';
import EncodedFileUploadField from './EncodedFileUploadField';

export const SourceSecretForm: React.FC<React.PropsWithChildren<unknown>> = () => {
  const [{ value: type }] = useField<SourceSecretType>('source.authType');

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
          <InputField name="source.username" label="Username" helperText="For Git authentication" />
          <InputField
            name="source.password"
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
          helpText="For Git authentication"
          required
        />
      )}
    </>
  );
};
