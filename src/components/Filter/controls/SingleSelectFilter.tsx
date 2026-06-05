import * as React from 'react';
import {
  MenuToggle,
  Select,
  SelectList,
  SelectOption,
  ToolbarFilter,
} from '@patternfly/react-core';
import { parseAsString, useQueryState } from 'nuqs';
import { FilterOption, OptionItem, SingleSelectFilterConfig } from '../types';

const isFilterOption = (item: OptionItem): item is FilterOption => 'value' in item;

type SingleSelectFilterProps<T> = {
  config: SingleSelectFilterConfig<T>;
  options: OptionItem[];
};

export const SingleSelectFilter = <T,>({ config, options }: SingleSelectFilterProps<T>) => {
  const { param, label } = config;
  const [isOpen, setIsOpen] = React.useState(false);

  const [selected, setSelected] = useQueryState(param, parseAsString.withDefault(''));

  const filterOptions = options.filter(isFilterOption);

  const labelForValue = (value: string): string =>
    filterOptions.find((o) => o.value === value)?.label ?? value;

  const handleSelect = (
    _event: React.MouseEvent | undefined,
    value: string | number | undefined,
  ) => {
    if (typeof value !== 'string') return;

    // Toggle-off: deselect if clicking same value
    void setSelected(value === selected ? null : value);
    setIsOpen(false);
  };

  const handleDeleteChip = () => {
    void setSelected(null);
  };

  const toggleLabel = selected ? labelForValue(selected) : label;

  const toggle = (toggleRef: React.Ref<HTMLButtonElement>) => (
    <MenuToggle
      ref={toggleRef}
      onClick={() => setIsOpen((prev) => !prev)}
      isExpanded={isOpen}
      data-test={`single-select-filter-${param}`}
    >
      {toggleLabel}
    </MenuToggle>
  );

  return (
    <ToolbarFilter
      chips={selected ? [labelForValue(selected)] : []}
      deleteChip={handleDeleteChip}
      categoryName={label}
    >
      <Select
        role="menu"
        isOpen={isOpen}
        onSelect={handleSelect}
        onOpenChange={setIsOpen}
        toggle={toggle}
      >
        <SelectList>
          {filterOptions.map((item) => (
            <SelectOption key={item.value} value={item.value} isSelected={item.value === selected}>
              {item.label}
            </SelectOption>
          ))}
        </SelectList>
      </Select>
    </ToolbarFilter>
  );
};
