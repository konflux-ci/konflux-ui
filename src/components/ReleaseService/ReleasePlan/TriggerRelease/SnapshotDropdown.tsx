import React from 'react';
import { useField, useFormikContext } from 'formik';
import { useSnapshotsForApplication } from '../../../../hooks/useSnapshots';
import DropdownField from '../../../../shared/components/formik-fields/DropdownField';
import FieldHelperText from '../../../../shared/components/formik-fields/FieldHelperText';
import { useNamespace } from '../../../../shared/providers/Namespace';

type SnapshotDropdownProps = Omit<
  React.ComponentProps<typeof DropdownField>,
  'items' | 'label' | 'placeholder'
> & { name: string; applicationName: string };

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

  const dropdownItems = React.useMemo(
    () =>
      !isLoading ? snapshots.map((a) => ({ key: a.metadata.name, value: a.metadata.name })) : [],
    [isLoading, snapshots],
  );

  React.useEffect(() => {
    // Reset snapshot dropdown value when applicationName changes
    void setValue('');
  }, [error, isLoading, props.applicationName, setErrors, setValue]);

  return (
    <>
      <DropdownField
        {...props}
        label="Snapshot"
        placeholder={isLoading || !!error ? 'Loading snapshots...' : 'Select snapshot'}
        isDisabled={props.isDisabled || isLoading || !!error}
        items={dropdownItems}
        onChange={(app: string) => setValue(app)}
      />
      {error ? (
        <FieldHelperText isValid={false} errorMessage={(error as { message: string }).message} />
      ) : null}
    </>
  );
};
