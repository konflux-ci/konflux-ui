import React from 'react';
import { RadioGroupField } from 'formik-pf';
import { SecretForComponentOption } from '../utils/secret-utils';
import { ComponentSelector } from './ComponentSelector';

type SecretLinkOptionsProps = {
  secretForComponentOption: SecretForComponentOption;
  onOptionChange: (option: SecretForComponentOption) => void;
};

export const SecretLinkOptions: React.FC<SecretLinkOptionsProps> = ({
  secretForComponentOption,
  onOptionChange,
}) => {
  return (
    <>
      <RadioGroupField
        name="secretForComponentOption"
        label="Link secret options"
        options={[
          {
            value: SecretForComponentOption.all,
            label: 'All existing and future components in the namespace',
          },
          {
            value: SecretForComponentOption.partial,
            label: 'Select components in the namespace',
          },
        ]}
        required={false}
        onChange={(value) => onOptionChange(value as SecretForComponentOption)}
      />

      {/* Secret Component Dropdown */}
      {secretForComponentOption === SecretForComponentOption.partial && <ComponentSelector />}
    </>
  );
};
