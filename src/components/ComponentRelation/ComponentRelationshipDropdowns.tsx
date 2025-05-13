import React from 'react';
import { ComponentSelectMenu } from '~/shared/components/component-select-menu/ComponentSelectMenu';

type MultiSelectComponentsDropdownProps = {
  sortedGroupedComponents: { [application: string]: string[] };
  sourceComponentName?: string;
  name: string;
};

export const MultiSelectComponentsDropdown: React.FC<MultiSelectComponentsDropdownProps> = ({
  sortedGroupedComponents,
  sourceComponentName,
  name,
}) => {
  const disableItem = React.useCallback(
    (item: string) => item === sourceComponentName,
    [sourceComponentName],
  );

  return (
    <ComponentSelectMenu
      name={name}
      options={sortedGroupedComponents}
      isMulti
      disableItem={disableItem}
      sourceComponentName={sourceComponentName}
      includeSelectAll
      defaultToggleText="Choose components to nudge"
      selectedToggleText="Component"
    />
  );
};

type SingleSelectComponentDropdownProps = {
  componentNames: string[];
  name: string;
  disableMenuItem?: (item: string) => boolean;
};

export const SingleSelectComponentDropdown: React.FC<SingleSelectComponentDropdownProps> = ({
  componentNames,
  name,
  disableMenuItem,
}) => {
  const options = React.useMemo(() => [...componentNames].sort(), [componentNames]);

  return (
    <ComponentSelectMenu
      name={name}
      options={options}
      isMulti={false}
      disableItem={disableMenuItem}
      defaultToggleText="Select a component"
      selectedToggleText={(value) => (value ? `${value as string}` : 'Select a component')}
    />
  );
};
