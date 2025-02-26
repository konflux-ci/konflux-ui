import React from 'react';
import { useField, useFormikContext } from 'formik';
import { useSnapshots } from '../../../../hooks/useSnapshots';
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
  const [snapshots, loaded, error] = useSnapshots(namespace);
  const [, , { setValue }] = useField<string>(props.name);

  const filteredSnapshots = React.useMemo(
    () =>
      loaded && props.applicationName && !error
        ? snapshots?.filter((sn) => sn.spec?.application === props.applicationName)
        : snapshots,
    [error, loaded, props.applicationName, snapshots],
  );

  const dropdownItems = React.useMemo(
    () => filteredSnapshots?.map((a) => ({ key: a.metadata.name, value: a.metadata.name })) ?? [],
    [filteredSnapshots],
  );

  React.useEffect(() => {
    // Reset snapshot dropdown value when applicationName changes
    void setValue('');
  }, [error, loaded, props.applicationName, setErrors, setValue]);

  return (
    <>
      <DropdownField
        {...props}
        label="Snapshot"
        placeholder={!loaded || !!error ? 'Loading snapshots...' : 'Select snapshot'}
        isDisabled={props.isDisabled || !loaded || !!error}
        items={dropdownItems}
        onChange={(app: string) => setValue(app)}
      />
      {error ? (
        <FieldHelperText isValid={false} errorMessage={(error as { message: string }).message} />
      ) : null}
    </>
  );
};
