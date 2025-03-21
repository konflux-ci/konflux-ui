import React, { useState, useMemo, useEffect } from 'react';
import { SelectVariant } from '@patternfly/react-core/deprecated';
import { useField, useFormikContext } from 'formik';
import { useSnapshots } from '../../../../hooks/useSnapshots';
import FieldHelperText from '../../../../shared/components/formik-fields/FieldHelperText';
import SelectInputField from '../../../../shared/components/formik-fields/SelectInputField';
import { useDebounceCallback } from '../../../../shared/hooks/useDebounceCallback';
import { useNamespace } from '../../../../shared/providers/Namespace';
type SnapshotDropdownProps = Omit<
  React.ComponentProps<typeof SelectInputField>,
  'options' | 'placeholderText'
> & { name: string; applicationName: string };

export const SnapshotDropdown: React.FC<React.PropsWithChildren<SnapshotDropdownProps>> = (
  props,
) => {
  const { setErrors } = useFormikContext();
  const namespace = useNamespace();
  const [snapshots, loaded, error] = useSnapshots(namespace);
  const [, , { setValue }] = useField<string>(props.name);

  const [searchTerm, setSearchTerm] = useState<string>('');

  const debouncedSetSearchTerm = useDebounceCallback(setSearchTerm, 500);

  const filteredSnapshots = useMemo(() => {
    if (!loaded || error || !props.applicationName) {
      return [];
    }

    // Filter by application name and then search term
    if (searchTerm.trim() === '') {
      return snapshots.filter((sn) => sn.spec?.application === props.applicationName);
    }

    return snapshots.filter(
      (sn) =>
        sn.spec?.application === props.applicationName &&
        sn.metadata.name.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [error, loaded, props.applicationName, snapshots, searchTerm]);

  const dropdownItems = useMemo(
    () =>
      filteredSnapshots
        .sort((a, b) => a.metadata.name.localeCompare(b.metadata.name))
        .map((a) => ({ value: a.metadata.name, disabled: false, key: a.metadata.name })) ?? [],
    [filteredSnapshots],
  );

  useEffect(() => {
    if (dropdownItems.length === 1) {
      void setValue(dropdownItems[0].value);
    } else {
      void setValue('');
    }
  }, [dropdownItems, setValue, setErrors]);

  const handleClear = () => {
    void setValue('');
    setSearchTerm('');
  };

  return (
    <>
      <SelectInputField
        {...props}
        label="Snapshot"
        variant={SelectVariant.typeahead}
        placeholderText={!loaded || !!error ? 'Loading snapshots...' : 'Select snapshot'}
        isDisabled={props.isDisabled || !loaded || !!error}
        options={dropdownItems}
        onSelect={(_, selection) => setValue(selection as string)}
        onClear={handleClear}
        onFilter={(e) => {
          e?.target?.value && debouncedSetSearchTerm(e.target.value);
        }}
      />
      {error ? (
        <FieldHelperText isValid={false} errorMessage={(error as { message: string }).message} />
      ) : null}
    </>
  );
};
