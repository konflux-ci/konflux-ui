import React from 'react';
import { useField } from 'formik';
import { useAllComponents } from '../../../../../hooks/useComponents';
import DropdownField from '../../../../../shared/components/formik-fields/DropdownField';
import { useNamespace } from '../../../../../shared/providers/Namespace';
import { TargetDropdownDefaults } from '../../../../../types';

type CVEComponentDropDownProps = Omit<
  React.ComponentProps<typeof DropdownField>,
  'items' | 'label'
>;

export const CVEComponentDropDown: React.FC<React.PropsWithChildren<CVEComponentDropDownProps>> = ({
  name,
}) => {
  const namespace = useNamespace();
  const [, , { setValue, setTouched }] = useField<string>(name);
  const [components, componentsLoaded, componentsError] = useAllComponents(namespace);

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
      name={name}
      label="Select component"
      placeholder={
        !componentsLoaded
          ? 'Loading components...'
          : componentsError
            ? 'Error loading components'
            : TargetDropdownDefaults.ALL_COMPONENTS
      }
      onChange={(component: string) => {
        void setValue(component, true);
        void setTouched(true);
      }}
      items={dropdownItems}
    />
  );
};
