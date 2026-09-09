import React from 'react';
import { ComponentSelectMenu } from '~/shared/components/component-select-menu/ComponentSelectMenu';

const getSelectedComponentsToggleText = (value: string | string[]): string => {
  const count = Array.isArray(value) ? value.length : 0;
  return `${count} component${count === 1 ? '' : 's'} selected`;
};

type MultiSelectComponentsDropdownProps = {
  sortedGroupedComponents: { [application: string]: string[] };
  sourceComponentName?: string;
  name: string;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export const MultiSelectComponentsDropdown: React.FC<MultiSelectComponentsDropdownProps> = ({
  sortedGroupedComponents,
  sourceComponentName,
  name,
  isOpen,
  onOpenChange,
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
      showCountBadge={false}
      defaultToggleText="Choose components to nudge"
      selectedToggleText={getSelectedComponentsToggleText}
      isOpen={isOpen}
      onOpenChange={onOpenChange}
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
