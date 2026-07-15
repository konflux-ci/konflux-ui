import React from 'react';
import { FormGroup, TextArea, type TextAreaProps as PFTextAreaProps } from '@patternfly/react-core';
import { useField } from 'formik';
import FieldHelperText from '../FieldHelperText';
import { FieldProps } from '../types';
import { getFieldId } from '../utils';

type TextAreaProps = Omit<FieldProps, 'ref'> & {
  placeholder?: string;
  onChange?: (event) => void;
  onBlur?: (event) => void;
  rows?: number;
  resizeOrientation?: 'vertical' | 'horizontal' | 'both';
};

const RenderComponent: React.FC<
  TextAreaProps & { forwardedRef: React.Ref<HTMLTextAreaElement> }
> = ({ label, helperText, isRequired, onChange, forwardedRef, ...props }) => {
  const [field, { touched, error }] = useField(props.name);
  const fieldId = getFieldId(props.name, 'input');
  const isValid = !(touched && error);
  const errorMessage = !isValid ? error : '';
  return (
    <FormGroup fieldId={fieldId} label={label} isRequired={isRequired}>
      <TextArea
        {...field}
        {...(props as unknown as PFTextAreaProps)}
        ref={forwardedRef}
        id={fieldId}
        style={{ resize: 'vertical' }}
        validated={isValid ? 'default' : 'error'}
        isRequired={isRequired}
        aria-describedby={helperText ? `${fieldId}-helper` : undefined}
        onChange={(event, value) => {
          onChange && onChange(value);
          field.onChange(event);
        }}
      />
      <FieldHelperText isValid={isValid} errorMessage={errorMessage} helpText={helperText} />
    </FormGroup>
  );
};

const renderFunction = (props: TextAreaProps, ref: React.Ref<HTMLTextAreaElement>) => (
  <RenderComponent forwardedRef={ref} {...props} />
);
renderFunction.displayName = 'TextAreaField';

const TextAreaField: React.ForwardRefExoticComponent<
  TextAreaProps & React.RefAttributes<HTMLTextAreaElement>
> = React.forwardRef<HTMLTextAreaElement, TextAreaProps>(renderFunction);

export default TextAreaField;
