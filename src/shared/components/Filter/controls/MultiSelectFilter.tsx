import * as React from 'react';
import {
  Badge,
  Divider,
  MenuToggle,
  Select,
  SelectList,
  SelectOption,
  ToolbarFilter,
} from '@patternfly/react-core';
import { parseAsJson, useQueryState } from 'nuqs';
import { FilterOption, MultiSelectFilterConfig, OptionItem } from '../types';

/** Type guard that distinguishes a selectable option from a divider. */
const isFilterOption = (item: OptionItem): item is FilterOption => 'value' in item;

/** Props for {@link MultiSelectFilter}. */
type MultiSelectFilterProps<T> = {
  /** Multi-select filter configuration. */
  config: MultiSelectFilterConfig<T>;
  /** Dropdown options (may include {@link DividerOption} entries). */
  options: OptionItem[];
};

/**
 * Multi-select checkbox filter control.
 *
 * Renders a PatternFly `Select` with checkboxes. Selected values are stored
 * as a JSON array in the URL parameter via nuqs. Chips are displayed via
 * `ToolbarFilter` and can be individually removed.
 *
 * @typeParam T - The data-item type being filtered.
 */
export const MultiSelectFilter = <T,>({ config, options }: MultiSelectFilterProps<T>) => {
  const { param, label } = config;
  const [isOpen, setIsOpen] = React.useState(false);

  const [selected, setSelected] = useQueryState(
    param,
    parseAsJson<string[]>((v) => (Array.isArray(v) ? v : [])).withDefault([]),
  );

  const filterOptions = options.filter(isFilterOption);

  const labelForValue = (value: string): string =>
    filterOptions.find((o) => o.value === value)?.label ?? value;

  const handleSelect = (
    _event: React.MouseEvent | undefined,
    value: string | number | undefined,
  ) => {
    if (typeof value !== 'string') return;

    const next = selected.includes(value)
      ? selected.filter((v) => v !== value)
      : [...selected, value];

    void setSelected(next.length > 0 ? next : null);
  };

  const handleDeleteChip = (_category: string | undefined, chip: string | undefined) => {
    if (!chip) return;
    const value = filterOptions.find((o) => o.label === chip)?.value ?? chip;
    const next = selected.filter((v) => v !== value);
    void setSelected(next.length > 0 ? next : null);
  };

  const handleDeleteChipGroup = () => {
    void setSelected(null);
  };

  const toggle = (toggleRef: React.Ref<HTMLButtonElement>) => (
    <MenuToggle
      ref={toggleRef}
      onClick={() => setIsOpen((prev) => !prev)}
      isExpanded={isOpen}
      data-test={`multi-select-filter-${param}`}
    >
      {label} {selected.length > 0 && <Badge isRead>{selected.length}</Badge>}
    </MenuToggle>
  );

  return (
    <ToolbarFilter
      chips={selected.map(labelForValue)}
      deleteChip={handleDeleteChip}
      deleteChipGroup={handleDeleteChipGroup}
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
          {options.map((item, index) => {
            if (!isFilterOption(item)) {
              return <Divider key={`divider-${index}`} />;
            }
            return (
              <SelectOption
                key={item.value}
                value={item.value}
                hasCheckbox
                isSelected={selected.includes(item.value)}
              >
                {item.label}
              </SelectOption>
            );
          })}
        </SelectList>
      </Select>
    </ToolbarFilter>
  );
};
