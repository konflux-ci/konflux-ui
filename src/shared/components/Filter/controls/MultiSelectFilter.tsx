import * as React from 'react';
import { ToolbarFilter } from '@patternfly/react-core';
import { parseAsJson, useQueryState } from 'nuqs';
import {
  isFilterOption,
  isGroupedOptions,
  type MultiSelectFilterConfig,
  type OptionItems,
} from '../types';
import { SelectDropdown } from './SelectDropdown';

/** Props for {@link MultiSelectFilter}. */
type MultiSelectFilterProps<T> = {
  /** Multi-select filter configuration. */
  config: MultiSelectFilterConfig<T>;
  /** Dropdown options (may include {@link DividerOption} entries or grouped options). */
  options: OptionItems;
  /** When true, the toggle is disabled. Auto-disabled when options are empty. */
  isDisabled?: boolean;
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
export const MultiSelectFilter = <T,>({
  config,
  options,
  isDisabled,
}: MultiSelectFilterProps<T>) => {
  const { param, label } = config;

  const [selected, setSelected] = useQueryState(
    param,
    parseAsJson<string[]>((v) => (Array.isArray(v) ? v : [])).withDefault([]),
  );

  // Collect all FilterOptions for chip label lookup (works for both flat and grouped)
  const allFilterOptions = React.useMemo(() => {
    if (isGroupedOptions(options)) {
      return options.flatMap((g) => g.options);
    }
    return options.filter(isFilterOption);
  }, [options]);

  const labelForValue = (value: string): string =>
    allFilterOptions.find((o) => o.value === value)?.label ?? value;

  const handleSelect = (value: string) => {
    const next = selected.includes(value)
      ? selected.filter((v) => v !== value)
      : [...selected, value];

    void setSelected(next.length > 0 ? next : null);
  };

  const handleDeleteChip = (_category: string | undefined, chip: string | undefined) => {
    if (!chip) return;
    const value = allFilterOptions.find((o) => o.label === chip)?.value ?? chip;
    const next = selected.filter((v) => v !== value);
    void setSelected(next.length > 0 ? next : null);
  };

  const handleDeleteChipGroup = () => {
    void setSelected(null);
  };

  const disabled = isDisabled || options.length === 0;

  return (
    <ToolbarFilter
      chips={selected.map(labelForValue)}
      deleteChip={handleDeleteChip}
      deleteChipGroup={handleDeleteChipGroup}
      categoryName={label}
    >
      <SelectDropdown
        toggleText={label}
        options={options}
        selected={selected}
        onSelect={handleSelect}
        multiple
        hasCheckbox
        badge
        isDisabled={disabled}
        data-test={`multi-select-filter-${param}`}
      />
    </ToolbarFilter>
  );
};
