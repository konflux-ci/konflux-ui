import React from 'react';
import { useField } from 'formik';
import { useAllComponents } from '../../../../../hooks/useComponents';
import DropdownField from '../../../../../shared/components/formik-fields/DropdownField';
import { TargetDropdownDefaults } from '../../../../../types';
import { useWorkspaceInfo } from '../../../../Workspace/useWorkspaceInfo';

type CVEComponentDropDownProps = Omit<
  React.ComponentProps<typeof DropdownField>,
  'items' | 'label'
>;

export const CVEComponentDropDown: React.FC<React.PropsWithChildren<CVEComponentDropDownProps>> = ({
  name,
}) => {
  const { namespace, workspace } = useWorkspaceInfo();
  const [, , { setValue, setTouched }] = useField<string>(name);
  const [components, componentsLoaded] = useAllComponents(namespace, workspace);

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
        !componentsLoaded ? 'Loading components...' : TargetDropdownDefaults.ALL_COMPONENTS
      }
      onChange={(component: string) => {
        void setValue(component, true);
        void setTouched(true);
      }}
      items={dropdownItems}
    />
  );
};
