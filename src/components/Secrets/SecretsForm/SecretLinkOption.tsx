import React from 'react';
import { RadioGroupField } from 'formik-pf';
import HelpPopover from '~/components/HelpPopover';
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
        label={
          <b>
            Link secret options{' '}
            <HelpPopover bodyContent="Select an option that allow you to link your desired components in this namespace while creating the secrets." />
          </b>
        }
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
