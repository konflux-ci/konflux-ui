import React from 'react';
import { useField } from 'formik';
import { ReleasePlanKind } from '../../../../../src/types/coreBuildService';
import DropdownField from '../../../../shared/components/formik-fields/DropdownField';

type ReleasePlanDropdownProps = Omit<
  React.ComponentProps<typeof DropdownField>,
  'items' | 'label' | 'placeholder'
> & {
  releasePlans: ReleasePlanKind[];
  loaded: boolean;
  name: string;
};

export const ReleasePlanDropdown: React.FC<React.PropsWithChildren<ReleasePlanDropdownProps>> = (
  props,
) => {
  const [{ value }, , { setValue }] = useField<string>(props.name);
  const dropdownItems = React.useMemo(
    () =>
      props.loaded
        ? props.releasePlans.map((a) => ({ key: a.metadata.name, value: a.metadata.name }))
        : [],
    [props.releasePlans, props.loaded],
  );

  return (
    <DropdownField
      {...props}
      label="Release plan"
      placeholder={!props.loaded ? 'Loading release plans...' : 'Select release plan'}
      isDisabled={props.isDisabled || !props.loaded}
      items={dropdownItems}
      value={value}
      onChange={(app: string) => setValue(app)}
    />
  );
};
