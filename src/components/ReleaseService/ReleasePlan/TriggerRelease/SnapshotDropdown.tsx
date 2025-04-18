import React from 'react';
import { useField, useFormikContext } from 'formik';
import { useSnapshotsForApplication } from '../../../../hooks/useSnapshots';
import { useNamespace } from '../../../../shared/providers/Namespace';
import { SelectTypeahead } from './SingleSelectField';

type SnapshotDropdownProps = {
  name: string;
  applicationName: string;
  helpText?: string;
  required?: boolean;
};

export const SnapshotDropdown: React.FC<React.PropsWithChildren<SnapshotDropdownProps>> = (
  props,
) => {
  const { setErrors } = useFormikContext();
  const namespace = useNamespace();
  const {
    data: snapshots,
    isLoading,
    error,
  } = useSnapshotsForApplication(namespace, props.applicationName);
  const [, , { setValue }] = useField<string>(props.name);

  const allSnapshots = React.useMemo(
    () =>
      !isLoading
        ? snapshots.map((a) => ({
            name: a.metadata.name,
            value: a.metadata.name,
            selected: false,
          }))
        : [],
    [isLoading, snapshots],
  );

  React.useEffect(() => {
    void setValue('');
    allSnapshots.forEach((snapshot) => (snapshot.selected = false));
  }, [error, isLoading, props.applicationName, setErrors, setValue, allSnapshots]);

  const handleSelect = React.useCallback(
    (snapshotName: string) => {
      if (!allSnapshots || allSnapshots.length === 0) {
        return;
      }

      allSnapshots.forEach((snapshot) => {
        snapshot.selected = snapshot.name === snapshotName;
      });

      void setValue(snapshotName);
    },
    [allSnapshots, setValue],
  );

  return (
    <>
      <SelectTypeahead
        {...props}
        label="Snapshot"
        options={allSnapshots.map((snapshot) => ({
          value: snapshot.name,
          children: snapshot.name,
        }))}
        placeholder="Select a snapshot"
        onOptionSelect={(value) => handleSelect(value as string)}
        setValue={setValue}
      />
    </>
  );
};
