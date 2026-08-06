import React from 'react';
import {
  Button,
  FormGroup,
  Label,
  MenuToggle,
  Select,
  SelectList,
  SelectOption,
  TextInputGroup,
  TextInputGroupMain,
  TextInputGroupUtilities,
} from '@patternfly/react-core';
import { TimesIcon } from '@patternfly/react-icons/dist/esm/icons/times-icon';
import { useField, useFormikContext, FormikValues } from 'formik';
import { useDeepCompareMemoize } from '../../hooks';
import { SelectInputFieldProps, SelectInputOption } from './field-types';
import { getFieldId } from './field-utils';
import FieldHelperText from './FieldHelperText';
import './SelectInputField.scss';

const CREATE_NEW_OPTION = '__create_new__';

const SelectInputField: React.FC<React.PropsWithChildren<SelectInputFieldProps>> = ({
  name,
  label,
  options,
  placeholderText,
  isCreatable,
  hasOnCreateOption,
  helpText,
  required,
  variant = 'typeaheadMulti',
  toggleId,
  toggleAriaLabel,
  isDisabled,
  onSelect: onSelectCallback,
  onClear: onClearCallback,
}) => {
  const [field, { touched, error }] = useField<string | string[]>(name);
  const { setFieldValue, setFieldTouched, validateForm } = useFormikContext<FormikValues>();
  const [isOpen, setIsOpen] = React.useState<boolean>(false);
  const [newOptions, setNewOptions] = React.useState<SelectInputOption[]>(options);
  const [filterValue, setFilterValue] = React.useState('');
  const textInputRef = React.useRef<HTMLInputElement>(null);
  const fieldId = getFieldId(name, 'select-input');
  const isValid = !(touched && error);
  const errorMessage = !isValid ? error : '';
  const isMulti = variant === 'typeaheadMulti';
  const selections: string[] = isMulti ? (Array.isArray(field.value) ? field.value : []) : [];
  const memoizedValue = useDeepCompareMemoize(field.value);

  React.useEffect(() => {
    void validateForm();
  }, [memoizedValue, validateForm]);

  React.useEffect(() => {
    setNewOptions(options);
  }, [options]);

  const filteredOptions = React.useMemo(() => {
    if (!filterValue) {
      return newOptions;
    }

    return newOptions.filter((op) => op.value.toLowerCase().includes(filterValue.toLowerCase()));
  }, [newOptions, filterValue]);

  const showCreateOption =
    isCreatable &&
    hasOnCreateOption &&
    filterValue &&
    !newOptions.some((op) => op.value.toLowerCase() === filterValue.toLowerCase());

  const onSelect = (_event: React.MouseEvent | undefined, value: string | number | undefined) => {
    if (value == null) {
      return;
    }

    const selection = String(value);

    if (selection === CREATE_NEW_OPTION) {
      const newVal = filterValue;
      const hasDuplicate = newOptions.find((op) => op.value === newVal);

      if (!hasDuplicate) {
        setNewOptions((prev) => [...prev, { value: newVal, disabled: false }]);
      }

      if (isMulti) {
        if (!selections.includes(newVal)) {
          void setFieldValue(name, [...selections, newVal]);
        }
      } else {
        void setFieldValue(name, newVal, true);
      }

      void setFieldTouched(name, true);
      setFilterValue('');
      if (!isMulti) {
        setIsOpen(false);
      }
      onSelectCallback?.(_event, newVal);
      return;
    }

    if (isMulti) {
      if (selections.includes(selection)) {
        void setFieldValue(
          name,
          selections.filter((s) => s !== selection),
        );
      } else {
        void setFieldValue(name, [...selections, selection]);
      }
    } else {
      void setFieldValue(name, selection, true);
    }

    void setFieldTouched(name, true);
    setFilterValue('');
    if (!isMulti) {
      setIsOpen(false);
    }
    onSelectCallback?.(_event, selection);
  };

  const onClearSelection = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    void setFieldValue(name, isMulti ? [] : '');
    void setFieldTouched(name, true);
    setFilterValue('');
    setIsOpen(false);
    onClearCallback?.();
  };

  const onToggleClick = () => {
    if (!isDisabled) {
      setIsOpen((prev) => !prev);
    }
  };

  const onInputClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isDisabled && !isOpen) {
      setIsOpen(true);
    }
  };

  const onInputBlur = () => {
    void setFieldTouched(name, true);
  };

  const onTextInputChange = (_event: React.FormEvent<HTMLInputElement>, value: string) => {
    setFilterValue(value);
    if (!isMulti) {
      if (isCreatable) {
        void setFieldValue(name, value, false);
      } else if (field.value) {
        void setFieldValue(name, '', false);
      }
    }
    if (!isOpen) {
      setIsOpen(true);
    }
  };

  const displayValue = React.useMemo(() => {
    if (isMulti) {
      return filterValue;
    }

    if (filterValue) {
      return filterValue;
    }

    return typeof field.value === 'string' ? field.value : '';
  }, [isMulti, filterValue, field.value]);

  const hasValue = isMulti ? selections.length > 0 : !!field.value || !!filterValue;

  const toggle = (toggleRef: React.Ref<HTMLButtonElement>) => (
    <MenuToggle
      ref={toggleRef}
      id={toggleId}
      aria-label={toggleAriaLabel}
      variant="typeahead"
      isExpanded={isOpen}
      isDisabled={isDisabled}
      onClick={onToggleClick}
      onBlur={onInputBlur}
      isFullWidth
    >
      <TextInputGroup isPlain isDisabled={isDisabled}>
        <TextInputGroupMain
          value={displayValue}
          onClick={onInputClick}
          onChange={onTextInputChange}
          autoComplete="off"
          innerRef={textInputRef}
          placeholder={placeholderText}
          role="combobox"
          isExpanded={isOpen}
          aria-controls={`${fieldId}-listbox`}
        >
          {isMulti &&
            selections.map((val) => (
              <Label
                key={val}
                variant="outline"
                onClose={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  void setFieldValue(
                    name,
                    selections.filter((s) => s !== val),
                  );
                  void setFieldTouched(name, true);
                }}
              >
                {val}
              </Label>
            ))}
        </TextInputGroupMain>
        <TextInputGroupUtilities
          {...(!hasValue ? { className: 'select-input-field__utilities--hidden' } : {})}
        >
          <Button
            icon={<TimesIcon aria-hidden />}
            variant="plain"
            onClick={onClearSelection}
            aria-label="Clear input value"
          />
        </TextInputGroupUtilities>
      </TextInputGroup>
    </MenuToggle>
  );

  return (
    <FormGroup fieldId={fieldId} label={label} isRequired={required}>
      <Select
        id={fieldId}
        isOpen={isOpen}
        selected={field.value}
        onSelect={onSelect}
        onOpenChange={setIsOpen}
        toggle={toggle}
        isScrollable
        maxMenuHeight="40vh"
      >
        <SelectList id={`${fieldId}-listbox`}>
          {filteredOptions.map((op) => (
            <SelectOption value={op.value} isDisabled={op.disabled} key={op.value}>
              {op.value}
            </SelectOption>
          ))}
          {showCreateOption && (
            <SelectOption value={CREATE_NEW_OPTION}>{`Create "${filterValue}"`}</SelectOption>
          )}
          {filteredOptions.length === 0 && !showCreateOption && (
            <SelectOption isDisabled>No results found</SelectOption>
          )}
        </SelectList>
      </Select>
      <FieldHelperText isValid={isValid} errorMessage={errorMessage} helpText={helpText} />
    </FormGroup>
  );
};

export default SelectInputField;
