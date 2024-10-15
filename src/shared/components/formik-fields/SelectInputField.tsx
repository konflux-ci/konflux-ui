import React, { SyntheticEvent } from 'react';
import { FormGroup } from '@patternfly/react-core';
import { Select, SelectVariant, SelectOption } from '@patternfly/react-core/deprecated';
import { useField, useFormikContext, FormikValues } from 'formik';
import { pull } from 'lodash-es';
import { useDeepCompareMemoize } from '../../hooks';
import { SelectInputFieldProps, SelectInputOption } from './field-types';
import { getFieldId } from './field-utils';
import FieldHelperText from './FieldHelperText';

const SelectInputField: React.FC<React.PropsWithChildren<SelectInputFieldProps>> = ({
  name,
  label,
  options,
  placeholderText,
  isCreatable,
  hasOnCreateOption,
  helpText,
  required,
  variant,
  toggleId,
  toggleAriaLabel,
  onSelect: onSelectCallback,
  onClear: onClearCallback,
  ...restProps
}) => {
  const [field, { touched, error }] = useField<string[]>(name);
  const { setFieldValue, setFieldTouched, validateForm } = useFormikContext<FormikValues>();
  const [isOpen, setIsOpen] = React.useState<boolean>(false);
  const [newOptions, setNewOptions] = React.useState<SelectInputOption[]>(options);
  const fieldId = getFieldId(name, 'select-input');
  const isValid = !(touched && error);
  const errorMessage = !isValid ? error : '';
  const selectVariant = variant || SelectVariant.typeaheadMulti;
  const memoizedValue = useDeepCompareMemoize(field.value);

  React.useEffect(() => {
    void validateForm();
  }, [memoizedValue, validateForm]);

  React.useEffect(() => {
    setNewOptions(options);
  }, [options]);

  const onToggle = () => {
    setIsOpen(!isOpen);
  };
  const onSelect = (event, selection: string) => {
    const selections = field.value;

    if (selectVariant === SelectVariant.typeaheadMulti) {
      if (selections.includes(selection)) {
        void setFieldValue(name, pull(selections, selection));
      } else {
        void setFieldValue(name, [...selections, selection]);
      }
    } else {
      void setFieldValue(name, selection, true);
    }

    void setFieldTouched(name, true);
    setIsOpen(false);
    onSelectCallback && onSelectCallback(event as SyntheticEvent<HTMLElement>, selection);
  };

  const onCreateOption = (newVal: string) => {
    const hasDuplicateOption = newOptions.find((option) => option.value === newVal);
    if (!hasDuplicateOption) {
      setNewOptions([...newOptions, { value: newVal, disabled: false }]);
    }
    void setFieldValue(name, newVal, true);
    void setFieldTouched(name, true);
  };

  const onClearSelection = () => {
    void setFieldValue(name, selectVariant === SelectVariant.typeaheadMulti ? [] : '');
    void setFieldTouched(name, true);
    onClearCallback && onClearCallback();
  };

  return (
    <FormGroup fieldId={fieldId} label={label} isRequired={required}>
      <Select
        {...restProps}
        name={name}
        variant={selectVariant}
        onToggle={onToggle}
        onSelect={onSelect}
        onClear={onClearSelection}
        isOpen={isOpen}
        selections={field.value}
        placeholderText={placeholderText}
        isCreatable={isCreatable}
        toggleId={toggleId}
        toggleAriaLabel={toggleAriaLabel}
        onCreateOption={(hasOnCreateOption && onCreateOption) || undefined}
      >
        {newOptions.map((op) => (
          <SelectOption value={op.value} isDisabled={op.disabled} key={op.value} />
        ))}
      </Select>
      <FieldHelperText isValid={isValid} errorMessage={errorMessage} helpText={helpText} />
    </FormGroup>
  );
};

export default SelectInputField;
