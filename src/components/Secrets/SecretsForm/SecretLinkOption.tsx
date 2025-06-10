import React from 'react';
import { RadioGroupField } from 'formik-pf';
import HelpPopover from '../../HelpPopover';
import { SecretForComponentOption } from '../utils/secret-utils';
import { ComponentSelector } from './ComponentSelector';

import './SecretLinkOptionForm.scss';

type SecretLinkOptionsProps = {
  secretForComponentOption: SecretForComponentOption;
  onOptionChange: (option: SecretForComponentOption) => void;
  radioLabels: {
    all: string;
    partial: string;
  };
};

export const SecretLinkOptions: React.FC<SecretLinkOptionsProps> = ({
  secretForComponentOption,
  onOptionChange,
  radioLabels,
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
            label: radioLabels.all,
          },
          {
            value: SecretForComponentOption.partial,
            label: radioLabels.partial,
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
