import React from 'react';
import {
  FormGroup,
  FormHelperText,
  HelperText,
  HelperTextItem,
  TextInputTypes,
  ValidatedOptions,
} from '@patternfly/react-core';
import { ExclamationCircleIcon } from '@patternfly/react-icons/dist/js/icons/exclamation-circle-icon';
import { useField } from 'formik';
import { FieldProps } from '../types';
import { getFieldId } from '../utils';

export type BaseInputFieldProps = FieldProps & {
  type?: TextInputTypes;
  placeholder?: string;
  onChange?: (event) => void;
  onBlur?: (event) => void;
  autoComplete?: string;
};

const BaseInputField: React.FC<
  BaseInputFieldProps & {
    children: (props) => React.ReactNode;
  }
> = ({
  children,
  name,
  label,
  labelHelp,
  helperText,
  helperTextInvalid,
  isRequired,
  validated,
  dataTest,
  onChange,
  ...props
}) => {
  const [field, { touched, error }] = useField({ name, type: 'input' });
  const fieldId = getFieldId(name, 'input');
  const isValid = !(touched && error);
  const errorMessage = !isValid ? error : '';
  return (
    <FormGroup
      fieldId={fieldId}
      label={label}
      labelHelp={labelHelp}
      isRequired={isRequired}
      data-test={dataTest}
    >
      {children({
        ...field,
        ...props,
        value: field.value || '',
        id: fieldId,
        label,
        validated: !isValid ? ValidatedOptions.error : validated,
        'aria-describedby': helperText ? `${fieldId}-helper` : undefined,
        onChange: (event) => {
          field.onChange(event);
          onChange && onChange(event);
        },
      })}
      {!isValid || validated === ValidatedOptions.error || helperText ? (
        <FormHelperText>
          <HelperText>
            {!isValid || validated === ValidatedOptions.error ? (
              <HelperTextItem icon={<ExclamationCircleIcon />} variant="error">
                {errorMessage || helperTextInvalid}
              </HelperTextItem>
            ) : (
              <HelperTextItem>{helperText}</HelperTextItem>
            )}
          </HelperText>
        </FormHelperText>
      ) : null}
    </FormGroup>
  );
};

export default BaseInputField;
