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
    hasError,
    archiveError,
    clusterError,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useSnapshotsForApplication(namespace, props.applicationName);
  const error = archiveError ?? clusterError;
  const [field, , { setValue }] = useField<string>(props.name);

  const dropdownItems = React.useMemo(
    () =>
      !isLoading ? snapshots?.map((a) => ({ key: a.metadata.name, value: a.metadata.name })) : [],
    [isLoading, snapshots],
  );

  React.useEffect(() => {
    // Only reset snapshot dropdown value if the current value is not valid for this application
    if (!isLoading && !hasError && snapshots && field.value) {
      const isCurrentSnapshotValid = snapshots.some(
        (snapshot) => snapshot.metadata.name === field.value,
      );
      if (!isCurrentSnapshotValid) {
        void setValue('');
      }
    }
  }, [hasError, isLoading, props.applicationName, setErrors, setValue, snapshots, field.value]);

  React.useEffect(() => {
    if (hasNextPage && !isFetchingNextPage && fetchNextPage) fetchNextPage();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  return (
    <>
      <DropdownField
        {...props}
        label="Snapshot"
        placeholder={isLoading || isFetchingNextPage ? 'Loading snapshots...' : 'Select snapshot'}
        isDisabled={props.isDisabled || isLoading}
        items={dropdownItems}
        onChange={(app: string) => setValue(app)}
      />
      {!snapshots?.length && hasError ? (
        <FieldHelperText isValid={false} errorMessage={(error as { message: string }).message} />
      ) : null}
    </>
  );
};
