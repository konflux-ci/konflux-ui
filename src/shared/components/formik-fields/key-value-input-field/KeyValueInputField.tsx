import * as React from 'react';
import { FormGroup } from '@patternfly/react-core';
import { useField, useFormikContext, FormikValues } from 'formik';
import compact from 'lodash/compact';
import isEmpty from 'lodash/isEmpty';
import { BasicNameValueEditor } from '../../name-value-editor';
import { KeyValueFieldProps } from '../field-types';
import { getFieldId } from '../field-utils';
import FieldHelperText from '../FieldHelperText';

const KeyValueField: React.FC<React.PropsWithChildren<KeyValueFieldProps>> = ({
  label,
  helpText,
  description,
  labelIcon,
  required,
  entries,
  readOnly = false,
  ...props
}) => {
  const { setFieldValue, values } = useFormikContext<FormikValues>();
  const [field] = useField<{ key: string; value: string }[]>(props.name);
  const fieldId = getFieldId(props.name, 'key-value-input');

  const nameValuePairs = React.useMemo(() => {
    const source = field.value?.length ? field.value : (entries ?? []);
    if (isEmpty(source)) {
      return [['', '']];
    }
    return source.map(({ key, value }) => [key, value]);
  }, [field.value, entries]);

  const [keyValue, setKeyValue] = React.useState(nameValuePairs);

  React.useEffect(() => {
    setKeyValue(nameValuePairs);
  }, [nameValuePairs]);

  const onChangeKeyValuePair = React.useCallback(
    ({ nameValuePairs: keyValuePairs }: { nameValuePairs: string[][] }) => {
      if (keyValuePairs) {
        const updatedNameValuePairs = compact(
          keyValuePairs.map(([key, value]) => (key.length || value.length ? { key, value } : null)),
        );
        setKeyValue(keyValuePairs);
        void setFieldValue(props.name, updatedNameValuePairs);
      }
    },
    [props.name, setFieldValue],
  );

  React.useEffect(() => {
    if (values.formReloadCount) {
      setKeyValue(nameValuePairs);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values.formReloadCount]);

  return (
    <FormGroup fieldId={fieldId} label={label} labelHelp={labelIcon} isRequired={required}>
      {description && <div className="pf-v6-c-form__helper-text">{description}</div>}
      <BasicNameValueEditor
        nameValuePairs={keyValue}
        valueString="Value"
        nameString="Key"
        addString="Add label"
        readOnly={readOnly}
        updateParentData={onChangeKeyValuePair}
      />
      <FieldHelperText helpText={helpText} />
    </FormGroup>
  );
};

export default KeyValueField;
