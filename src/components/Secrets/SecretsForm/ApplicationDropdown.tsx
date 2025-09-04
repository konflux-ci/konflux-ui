import React from 'react';
import { useField } from 'formik';
import { getApplicationDisplayName } from '~/utils/common-utils';
import { useApplications } from '../../../hooks/useApplications';
import DropdownField from '../../../shared/components/formik-fields/DropdownField';
import { useNamespace } from '../../../shared/providers/Namespace';

type ApplicationDropdownProps = Omit<
  React.ComponentProps<typeof DropdownField>,
  'items' | 'label' | 'placeholder'
>;

export const ApplicationDropdown: React.FC<React.PropsWithChildren<ApplicationDropdownProps>> = (
  props,
) => {
  const namespace = useNamespace();
  const [applications, loaded, error] = useApplications(namespace);
  const [, , { setValue }] = useField<string>(props.name);

  const dropdownItems = React.useMemo(
    () =>
      loaded
        ? error
          ? [
              {
                key: 'error',
                value: 'Unable to load applications',
                isDisabled: true,
              },
            ]
          : applications.map((a) => ({
              key: a.metadata.name,
              value: getApplicationDisplayName(a),
            }))
        : [],
    [applications, loaded, error],
  );

  return (
    <DropdownField
      {...props}
      label="Select application"
      placeholder={!loaded ? 'Loading applications...' : 'Select application'}
      isDisabled={props.isDisabled || !loaded}
      items={dropdownItems}
      onChange={(app: string) => setValue(app)}
    />
  );
};
