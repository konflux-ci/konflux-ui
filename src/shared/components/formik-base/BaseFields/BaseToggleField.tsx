import React from 'react';
import { FormGroup } from '@patternfly/react-core';
import { useField } from 'formik';
import FieldHelperText from '../FieldHelperText';
import { FieldProps } from '../types';
import { getFieldId } from '../utils';

export type BaseToggleFieldProps = FieldProps & {
  formLabel?: string;
  value?: string;
  onChange?: (val: boolean) => void;
};

const BaseToggleField: React.FC<
  BaseToggleFieldProps & { children: (props) => React.ReactNode }
> = ({ label, formLabel, helperText, isRequired, children, value, onChange, name, ...props }) => {
  const [field, { touched, error }] = useField({ value, name, type: 'checkbox' });
  const fieldId = getFieldId(name, 'checkbox');
  const isValid = !(touched && error);
  const errorMessage = !isValid ? error : '';

  return (
    <FormGroup fieldId={fieldId} label={formLabel} isRequired={isRequired}>
      {children({
        ...field,
        ...props,
        value: field.value ?? false,
        id: fieldId,
        label,
        isChecked: field.checked,
        isValid,
        'aria-describedby': helperText ? `${fieldId}-helper` : undefined,
        onChange: (event: React.FormEvent<HTMLInputElement>, val: boolean) => {
          field.onChange(event);
          onChange?.(val);
        },
      })}
      <FieldHelperText isValid={isValid} errorMessage={errorMessage} helpText={helperText} />
    </FormGroup>
  );
};

export default BaseToggleField;
