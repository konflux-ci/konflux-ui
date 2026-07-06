import * as React from 'react';
import {
  Badge,
  Divider,
  MenuToggle,
  Select,
  SelectGroup,
  SelectList,
  SelectOption,
} from '@patternfly/react-core';
import { isFilterOption, isGroupedOptions, type OptionItems } from '../types';

/** Props for {@link SelectDropdown}. */
export interface SelectDropdownProps {
  /** Text displayed on the toggle button. */
  toggleText: string;
  /** Optional icon rendered before the toggle text. */
  toggleIcon?: React.ReactNode;
  /** Flat or grouped options to display in the dropdown. */
  options: OptionItems;
  /** Currently selected value(s). */
  selected: string | string[];
  /** Called when an option is selected or deselected. */
  onSelect: (value: string) => void;
  /** When true, the dropdown stays open after selection. */
  multiple?: boolean;
  /** When true, options render with checkboxes. */
  hasCheckbox?: boolean;

  /** When true, the toggle is disabled. */
  isDisabled?: boolean;
  /** When true, shows a Badge with the count of selected items on the toggle. */
  badge?: boolean;
}

/**
 * Presentational select dropdown component.
 *
 * Renders a PatternFly `Select` with support for flat or grouped options,
 * checkbox or checkmark selection, badges, and option descriptions/icons.
 */
export const SelectDropdown: React.FC<SelectDropdownProps> = ({
  toggleText,
  toggleIcon,
  options,
  selected,
  onSelect,
  multiple,
  hasCheckbox,

  isDisabled,
  badge,
}) => {
  const [isOpen, setIsOpen] = React.useState(false);

  const selectedArray = Array.isArray(selected) ? selected : selected ? [selected] : [];

  const handleSelect = (
    _event: React.MouseEvent | undefined,
    value: string | number | undefined,
  ) => {
    if (typeof value !== 'string') return;
    onSelect(value);
    if (!multiple) {
      setIsOpen(false);
    }
  };

  const toggle = (toggleRef: React.Ref<HTMLButtonElement>) => (
    <MenuToggle
      ref={toggleRef}
      onClick={() => setIsOpen((prev) => !prev)}
      isExpanded={isOpen}
      isDisabled={isDisabled}
      icon={toggleIcon}
    >
      {toggleText}{' '}
      {badge && selectedArray.length > 0 && <Badge isRead>{selectedArray.length}</Badge>}
    </MenuToggle>
  );

  const role = hasCheckbox ? 'menu' : undefined;

  const renderOption = (option: {
    label: string;
    value: string;
    description?: string;
    icon?: React.ReactNode;
  }) => (
    <SelectOption
      key={option.value}
      value={option.value}
      hasCheckbox={hasCheckbox}
      isSelected={selectedArray.includes(option.value)}
      description={option.description}
      icon={option.icon}
    >
      {option.label}
    </SelectOption>
  );

  const grouped = isGroupedOptions(options);

  return (
    <Select
      role={role}
      isOpen={isOpen}
      onSelect={handleSelect}
      onOpenChange={setIsOpen}
      toggle={toggle}
    >
      {grouped ? (
        options.map((group) => (
          <SelectGroup key={group.group} label={group.group}>
            <SelectList>{group.options.map(renderOption)}</SelectList>
          </SelectGroup>
        ))
      ) : (
        <SelectList>
          {options.map((item, index) => {
            if (!isFilterOption(item)) {
              return <Divider key={`divider-${index}`} />;
            }
            return renderOption(item);
          })}
        </SelectList>
      )}
    </Select>
  );
};
