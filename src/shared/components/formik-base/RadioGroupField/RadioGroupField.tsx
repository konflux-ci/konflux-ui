import React from 'react';
import { FormGroup } from '@patternfly/react-core';
import classNames from 'classnames';
import { useField } from 'formik';
import FieldHelperText from '../FieldHelperText';
import RadioButtonField from '../RadioButtonField/RadioButtonField';
import { FieldProps } from '../types';
import { getFieldId } from '../utils';

import './RadioGroupField.scss';

export type RadioGroupOption = {
  value: React.ReactText;
  label: React.ReactNode;
  isDisabled?: boolean;
  children?: React.ReactNode;
  activeChildren?: React.ReactElement;
};

export type RadioGroupFieldProps = FieldProps & {
  options: RadioGroupOption[];
  onChange?: (value: React.ReactText) => void;
};

const RadioGroupField: React.FC<RadioGroupFieldProps> = ({
  label,
  options,
  helperText,
  isRequired,
  isInline,
  onChange,
  ...props
}) => {
  const [field, { touched, error }] = useField(props.name);
  const fieldId = getFieldId(props.name, 'radiogroup');
  const isValid = !(touched && error);
  const errorMessage = !isValid ? error : '';
  return (
    <FormGroup
      className={classNames('radio-group-field', {
        'radio-group-field--inline': isInline,
      })}
      fieldId={fieldId}
      isRequired={isRequired}
      label={label}
      isInline={isInline}
    >
      {options.map((option) => {
        const activeChild = field.value === option.value && option.activeChildren;
        const staticChild = option.children;

        const description = (activeChild || staticChild) && (
          <div className="radio-group-field__children">
            {staticChild}
            {activeChild}
          </div>
        );

        return (
          <React.Fragment key={option.value}>
            <RadioButtonField
              {...field}
              {...props}
              value={option.value}
              label={option.label}
              isDisabled={option.isDisabled}
              aria-describedby={helperText ? `${fieldId}-helper` : undefined}
              description={description}
              onChange={onChange}
            />
          </React.Fragment>
        );
      })}
      <FieldHelperText isValid={isValid} errorMessage={errorMessage} helpText={helperText} />
    </FormGroup>
  );
};

export default RadioGroupField;
