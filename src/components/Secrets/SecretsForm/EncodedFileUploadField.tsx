import * as React from 'react';
import { ValidatedOptions } from '@patternfly/react-core';
import { useField } from 'formik';
import { FileUploadField } from 'formik-pf';
import { Base64 } from 'js-base64';
import attempt from 'lodash-es/attempt';
import isError from 'lodash-es/isError';
import { useOptionalSecretEditSensitive } from './SecretEditSensitiveContext';

type EncodedFileUploadFieldProps = {
  id: string;
  name: string;
  label: string;
  helpText?: string;
  required?: boolean;
  onValidate?: (decodedContent: string, filename?: string) => void;
  /** When set (edit secret + sensitive context), blur clears this field and drops cached full secret. */
  sensitiveFieldPath?: string;
};

const EncodedFileUploadField: React.FC<React.PropsWithChildren<EncodedFileUploadFieldProps>> = ({
  id,
  name,
  label,
  helpText,
  required,
  onValidate,
  sensitiveFieldPath,
}) => {
  const [filename, setFilename] = React.useState<string>();
  const filenameRef = React.useRef<string>();
  const [, { value, error, touched }, { setValue, setTouched }] = useField<string>(name);
  const isValid = !(touched && error);
  const sensitive = useOptionalSecretEditSensitive();

  const onChange = React.useCallback(
    (data: string, fileUploaded?: boolean) => {
      const parsedData = attempt(JSON.parse, data);
      const hasError = isError(parsedData);
      void setValue(
        data && !hasError && !!fileUploaded
          ? Base64.encode(JSON.stringify(parsedData))
          : Base64.encode(data),
        true,
      );

      setTimeout(() => setTouched(true));
      if (onValidate) {
        onValidate(data, filenameRef.current);
      }
    },
    [setValue, setTouched, onValidate],
  );

  const decodedValue = React.useMemo(() => (value ? Base64.decode(value) : ''), [value]);
  return (
    <FileUploadField
      name={name}
      id={id}
      label={label}
      type="text"
      filenamePlaceholder="Drag a file here or upload one"
      browseButtonText="Upload"
      filename={filename}
      value={decodedValue}
      helperText={!isValid ? error : undefined}
      validated={!isValid ? ValidatedOptions.error : ValidatedOptions.default}
      onReadFinished={(_ev, file) => {
        setFilename(file.name);
        filenameRef.current = file.name;
      }}
      onBlur={() => {
        void setTouched(true);
        if (sensitiveFieldPath && sensitive && value) {
          void sensitive.onSensitiveFieldBlur(sensitiveFieldPath);
        }
      }}
      onTextChange={(_ev, updated) => onChange(updated)}
      onDataChange={(_ev, updated) => onChange(updated, true)}
      onClearClick={() => {
        void setValue('');
        setFilename('');
        filenameRef.current = undefined;
        if (onValidate) {
          onValidate('');
        }
      }}
      allowEditingUploadedText
      required={required}
    >
      {helpText && <div className="pf-v5-c-form__helper-text">{helpText}</div>}
    </FileUploadField>
  );
};

export default EncodedFileUploadField;
