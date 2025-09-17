import React from 'react';
import { RadioGroupField } from 'formik-pf';
import { SECRET_LINK_OPTION_HELP_TEXT } from '~/consts/secrets';
import { CurrentComponentRef } from '~/types';
import HelpPopover from '../../HelpPopover';
import { SecretForComponentOption } from '../utils/secret-utils';
import { ComponentSelector } from './ComponentSelector';

import './SecretLinkOptionForm.scss';

type SecretLinkOptionsProps = {
  secretForComponentOption: SecretForComponentOption;
  onOptionChange: (option: SecretForComponentOption) => void;
  radioLabels: {
    none?: string;
    all: string;
    partial: string;
  };
  currentComponent?: null | CurrentComponentRef;
};

export const SecretLinkOptions: React.FC<SecretLinkOptionsProps> = ({
  secretForComponentOption,
  onOptionChange,
  radioLabels,
  currentComponent,
}) => {
  return (
    <>
      <RadioGroupField
        name="secretForComponentOption"
        label={
          <b>
            Link secret options <HelpPopover bodyContent={SECRET_LINK_OPTION_HELP_TEXT} />
          </b>
        }
        options={[
          ...(radioLabels.none
            ? [
                {
                  value: SecretForComponentOption.none,
                  label: radioLabels.none,
                },
              ]
            : []),
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
