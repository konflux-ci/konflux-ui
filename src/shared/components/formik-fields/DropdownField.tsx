import React from 'react';
import { FormGroup, ValidatedOptions } from '@patternfly/react-core';
import { useField, useFormikContext, FormikValues } from 'formik';
import BasicDropdown, { DropdownItemObject } from '../dropdown/BasicDropdown';
import { getFieldId } from './field-utils';
import FieldHelperText from './FieldHelperText';

export interface FieldProps {
  name: string;
  label?: React.ReactNode;
  labelIcon?: React.ReactElement;
  helpText?: React.ReactNode;
  helpTextInvalid?: React.ReactNode;
  required?: boolean;
  style?: React.CSSProperties;
  isReadOnly?: boolean;
  disableDeleteRow?: boolean;
  disableAddRow?: boolean;
  className?: string;
  isDisabled?: boolean;
  validated?: ValidatedOptions;
  dataTest?: string;
}

export interface DropdownFieldProps extends FieldProps {
  name: string;
  value?: string;
  items: DropdownItemObject[];
  selectedKey?: string;
  recommended?: string;
  title?: React.ReactNode;
  fullWidth?: boolean;
  disabled?: boolean;
  placeholder?: string;
  validateOnChange?: boolean;
  autocompleteFilter?: (text: string, item: object, key?: string) => boolean;
  onChange?: (value: string) => void;
  dropdownToggle?: (
    onToggle: (
      ev:
        | MouseEvent
        | TouchEvent
        | KeyboardEvent
        | React.KeyboardEvent<unknown>
        | React.MouseEvent<HTMLButtonElement>,
      isOpen: boolean,
    ) => void,
  ) => React.ReactElement;
}

const DropdownField: React.FC<React.PropsWithChildren<DropdownFieldProps>> = ({
  label,
  labelIcon,
  helpText,
  required,
  items,
  name,
  recommended = null,
  onChange,
  fullWidth,
  validateOnChange = false,
  value,
  isDisabled,
  className,
  ...props
}) => {
  const [field, { touched, error }] = useField(name);
  const { setFieldValue, setFieldTouched } = useFormikContext<FormikValues>();
  const fieldId = getFieldId(name, 'dropdown');
  const isValid = !(touched && error);
  const errorMessage = !isValid ? error : '';
  const validated = isValid ? ValidatedOptions.default : ValidatedOptions.error;

  return (
    <FormGroup
      fieldId={fieldId}
      label={label}
      labelIcon={labelIcon}
      isRequired={required}
      className={className}
    >
      <BasicDropdown
        {...props}
        validated={validated}
        disabled={isDisabled}
        items={items}
        selected={value ?? field.value}
        recommended={recommended}
        fullWidth={fullWidth}
        aria-describedby={helpText ? `${fieldId}-helper` : undefined}
        onChange={(val: string) => {
          if (onChange) {
            onChange(val);
            return;
          }
          void setFieldValue(name, val, validateOnChange);
          void setFieldTouched(name, true, false);
        }}
      />
      <FieldHelperText isValid={isValid} errorMessage={errorMessage} helpText={helpText} />
    </FormGroup>
  );
};

export default DropdownField;
