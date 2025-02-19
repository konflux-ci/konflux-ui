import React from 'react';
import { useField } from 'formik';
import { useComponents } from '../../../hooks/useComponents';
import DropdownField from '../../../shared/components/formik-fields/DropdownField';
import { useNamespace } from '../../../shared/providers/Namespace';
import { TargetDropdownDefaults } from '../../../types';

type ComponentDropdownProps = Omit<React.ComponentProps<typeof DropdownField>, 'items' | 'label'>;

export const ComponentDropdown: React.FC<React.PropsWithChildren<ComponentDropdownProps>> = (
  props,
) => {
  const namespace = useNamespace();
  const [{ value: application }] = useField<string>('targets.application');
  const [, , { setValue, setTouched }] = useField<string>(props.name);
  const [components, loaded] = useComponents(namespace, application);

  const dropdownItems = React.useMemo(
    () => [
      { key: 'all-components', value: TargetDropdownDefaults.ALL_COMPONENTS },
      { key: 'separator', value: 'separator', separator: true },
      ...components.map((a) => ({ key: a.metadata.name, value: a.metadata.name })),
    ],
    [components],
  );

  return (
    <DropdownField
      {...props}
      label="Select component"
      placeholder={!loaded ? 'Loading components...' : TargetDropdownDefaults.ALL_COMPONENTS}
      onChange={(component: string) => {
        void setValue(component, true);
        void setTouched(true);
      }}
      items={dropdownItems}
      isDisabled={!application}
    />
  );
};
