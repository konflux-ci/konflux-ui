import React from 'react';
import { RadioGroupField } from 'formik-pf';
import { CurrentComponentRef } from '~/types';
import HelpPopover from '../../HelpPopover';
import { SecretForComponentOption } from '../utils/secret-utils';
import { ComponentSelector } from './ComponentSelector';

import './SecretLinkOptionForm.scss';

type SecretLinkOptionsProps = {
  secretForComponentOption: SecretForComponentOption;
  onOptionChange: (option: SecretForComponentOption) => void;
  helpPopoverText?: string;
  radioLabels: {
    all: string;
    partial: string;
  };
  currentComponent?: null | CurrentComponentRef;
};

export const SecretLinkOptions: React.FC<SecretLinkOptionsProps> = ({
  secretForComponentOption,
  onOptionChange,
  helpPopoverText,
  radioLabels,
  currentComponent,
}) => {
  return (
    <>
      <RadioGroupField
        name="secretForComponentOption"
        label={
          <b>
            Link secret options {helpPopoverText && <HelpPopover bodyContent={helpPopoverText} />}
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
      {secretForComponentOption === SecretForComponentOption.partial && (
        <ComponentSelector currentComponent={currentComponent} />
      )}
    </>
  );
};
