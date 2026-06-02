import React from 'react';
import {
  Button,
  FormGroup,
  FormHelperText,
  HelperText,
  HelperTextItem,
  TextInputGroup,
  TextInputGroupMain,
  TextInputGroupUtilities,
} from '@patternfly/react-core';
import { ExclamationCircleIcon } from '@patternfly/react-icons/dist/esm/icons/exclamation-circle-icon';
import { EyeIcon } from '@patternfly/react-icons/dist/esm/icons/eye-icon';
import { EyeSlashIcon } from '@patternfly/react-icons/dist/esm/icons/eye-slash-icon';
import { useField } from 'formik';
import { getFieldId } from '~/shared/components/formik-fields/field-utils';
import { useOptionalSecretEditSensitive } from './SecretEditSensitiveContext';

export type SecretPasswordInputFieldProps = {
  name: string;
  label?: React.ReactNode;
  helperText?: string;
  helperTextInvalid?: string;
  placeholder?: string;
  isRequired?: boolean;
  required?: boolean;
  'data-test'?: string;
  dataTest?: string;
  isDisabled?: boolean;
};

export const SecretPasswordInputField: React.FC<SecretPasswordInputFieldProps> = ({
  name,
  label,
  helperText,
  helperTextInvalid,
  placeholder,
  isRequired,
  required,
  'data-test': dataTestAttr,
  dataTest,
  isDisabled,
}) => {
  const sensitive = useOptionalSecretEditSensitive();
  const showVisibilityToggle = sensitive?.fullSecret !== undefined;

  const [isPasswordVisible, setIsPasswordVisible] = React.useState(false);
  const [field, meta] = useField<string>(name);
  const fieldId = getFieldId(name, 'input');
  const resolvedDataTest = dataTest ?? dataTestAttr;
  const isValid = !(meta.touched && meta.error);
  const errorMessage = meta.touched && meta.error ? String(meta.error) : undefined;
  const passwordLabel = typeof label === 'string' ? label : 'Password';

  const passwordInputRef = React.useRef<HTMLInputElement>(null);
  React.useEffect(() => {
    if (resolvedDataTest && passwordInputRef.current) {
      passwordInputRef.current.setAttribute('data-test', resolvedDataTest);
    }
  }, [resolvedDataTest]);

  return (
    <FormGroup fieldId={fieldId} label={label} isRequired={isRequired ?? required}>
      <TextInputGroup isDisabled={isDisabled}>
        <TextInputGroupMain
          type={isPasswordVisible && showVisibilityToggle ? 'text' : 'password'}
          inputId={fieldId}
          name={name}
          value={field.value ?? ''}
          onChange={(_event, value) => {
            void field.onChange({ target: { name, value } });
          }}
          onBlur={field.onBlur}
          placeholder={placeholder}
          aria-label={passwordLabel}
          innerRef={passwordInputRef}
        />
        {showVisibilityToggle ? (
          <TextInputGroupUtilities>
            <Button
              variant="plain"
              type="button"
              onClick={() => setIsPasswordVisible((visible) => !visible)}
              aria-label={isPasswordVisible ? 'Hide password' : 'Show password'}
            >
              {isPasswordVisible ? <EyeSlashIcon aria-hidden /> : <EyeIcon aria-hidden />}
            </Button>
          </TextInputGroupUtilities>
        ) : null}
      </TextInputGroup>
      {(helperText || !isValid) && (
        <FormHelperText>
          <HelperText>
            {isValid ? (
              <HelperTextItem>{helperText}</HelperTextItem>
            ) : (
              <HelperTextItem icon={<ExclamationCircleIcon />} variant="error">
                {errorMessage || helperTextInvalid}
              </HelperTextItem>
            )}
          </HelperText>
        </FormHelperText>
      )}
    </FormGroup>
  );
};
