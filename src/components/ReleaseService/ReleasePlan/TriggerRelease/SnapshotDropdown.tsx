import React, { useState, useMemo, useEffect } from 'react';
import {
  Select,
  SelectOption,
  SelectList,
  MenuToggle,
  MenuToggleElement,
  TextInputGroup,
  TextInputGroupMain,
  TextInputGroupUtilities,
  Button,
  FormGroup,
} from '@patternfly/react-core';
import TimesIcon from '@patternfly/react-icons/dist/esm/icons/times-icon';
import { useField, useFormikContext } from 'formik';
import { useSnapshotsForApplication } from '../../../../hooks/useSnapshots';
import FieldHelperText from '../../../../shared/components/formik-fields/FieldHelperText';
import SelectInputField from '../../../../shared/components/formik-fields/SelectInputField';
import { useDebounceCallback } from '../../../../shared/hooks/useDebounceCallback';
import { useNamespace } from '../../../../shared/providers/Namespace';

type SnapshotDropdownProps = Omit<
  React.ComponentProps<typeof SelectInputField>,
  'options' | 'placeholderText'
> & {
  name: string;
  applicationName: string;
  label?: string;
  helpText?: string;
  required?: boolean;
};

export const SnapshotDropdown: React.FC<React.PropsWithChildren<SnapshotDropdownProps>> = (
  props,
) => {
  const { setErrors } = useFormikContext();
  const namespace = useNamespace();
  const {
    data: snapshots = [],
    isLoading,
    error,
  } = useSnapshotsForApplication(namespace, props.applicationName);
  const [, { touched, error: fieldError }, { setValue }] = useField<string>(props.name);
  const [inputValue, setInputValue] = React.useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState<string>('');

  const debouncedSetSearchTerm = useDebounceCallback(setSearchTerm, 500);

  const filteredSnapshots = useMemo(() => {
    if (isLoading || error || !props.applicationName) {
      return [];
    }

    if (searchTerm.trim() === '') {
      return snapshots;
    }

    return snapshots.filter((sn) =>
      sn.metadata.name.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [error, isLoading, snapshots, searchTerm, props.applicationName]);

  const dropdownItems = useMemo(
    () =>
      filteredSnapshots
        .sort((a, b) => a.metadata.name.localeCompare(b.metadata.name))
        .map((a) => ({ value: a.metadata.name, children: a.metadata.name })) ?? [],
    [filteredSnapshots],
  );

  useEffect(() => {
    if (dropdownItems.length === 1) {
      void setValue(dropdownItems[0].value);
      setSelected(dropdownItems[0].value);
    } else {
      void setValue('');
      !searchTerm && !selected && setSelected('');
    }
  }, [dropdownItems, setValue, setErrors, searchTerm, selected]);

  const onSelect = (
    _event: React.MouseEvent<Element, MouseEvent> | undefined,
    value: string | number | undefined,
  ) => {
    if (value) {
      void setValue(value as string);
      setSelected(value as string);
      setInputValue(value as string);
      setIsOpen(false);
      setSearchTerm('');
    }
  };

  const onToggle = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setSearchTerm('');
    } else if (!searchTerm && selected) {
      setSearchTerm(selected);
    }
  };

  const onClear = () => {
    void setValue('');
    setSelected('');
    setInputValue('');
    setSearchTerm('');
  };

  const onSearchInputChange = (value: string) => {
    setSearchTerm(value);
    void debouncedSetSearchTerm(value);
    setInputValue(value);
  };

  const isValid = !(touched && fieldError);
  const errorMessage = !isValid ? fieldError : '';

  return (
    <FormGroup fieldId={props.name} label={'Snapshot'} isRequired={props.required}>
      <Select
        id="snapshot-dropdown"
        isOpen={isOpen}
        selected={selected}
        onSelect={onSelect}
        onOpenChange={onToggle}
        isScrollable
        toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
          <MenuToggle
            ref={toggleRef}
            variant="typeahead"
            aria-label="Snapshot dropdown toggle"
            onClick={() => {
              setSearchTerm(selected);
              setIsOpen(!isOpen);
            }}
            isExpanded={isOpen}
            isFullWidth
          >
            <TextInputGroup isPlain>
              <TextInputGroupMain
                value={inputValue}
                onClick={(e) => {
                  e.stopPropagation();
                  setIsOpen(true);
                }}
                onChange={(e) => {
                  e.stopPropagation();
                  onSearchInputChange((e.target as HTMLInputElement).value);
                }}
                placeholder={isLoading ? 'Loading snapshots...' : 'Select snapshot'}
                autoComplete="off"
                role="combobox"
                isExpanded={isOpen}
                aria-controls="snapshot-dropdown-listbox"
              />
              <TextInputGroupUtilities>
                <Button variant="plain" onClick={onClear} aria-label="Clear input value">
                  <TimesIcon aria-hidden />
                </Button>
              </TextInputGroupUtilities>
            </TextInputGroup>
          </MenuToggle>
        )}
      >
        <SelectList id="snapshot-dropdown-listbox">
          {dropdownItems.map((option) => (
            <SelectOption key={option.value} {...option} />
          ))}
        </SelectList>
      </Select>
      <FieldHelperText isValid={isValid} errorMessage={errorMessage} helpText={props.helpText} />
    </FormGroup>
  );
};
