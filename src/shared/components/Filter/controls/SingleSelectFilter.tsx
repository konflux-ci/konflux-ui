import * as React from 'react';
import { ToolbarFilter } from '@patternfly/react-core';
import { parseAsString, useQueryState } from 'nuqs';
import {
  isFilterOption,
  isGroupedOptions,
  type OptionItems,
  type SingleSelectFilterConfig,
} from '../types';
import { SelectDropdown } from './SelectDropdown';

/** Props for {@link SingleSelectFilter}. */
type SingleSelectFilterProps<T> = {
  /** Single-select filter configuration. */
  config: SingleSelectFilterConfig<T>;
  /** Dropdown options (divider entries are filtered out for chips, but rendered in dropdown). */
  options: OptionItems;
};

/**
 * Single-select dropdown filter control.
 *
 * Renders a PatternFly `Select` where only one value can be active at a time.
 * Clicking the currently selected value deselects it. The selected value is
 * stored in the URL as a plain string via nuqs.
 *
 * @typeParam T - The data-item type being filtered.
 */
export const SingleSelectFilter = <T,>({ config, options }: SingleSelectFilterProps<T>) => {
  const { param, label } = config;

  const [selected, setSelected] = useQueryState(param, parseAsString.withDefault(''));

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
    // Toggle-off: deselect if clicking same value
    void setSelected(value === selected ? null : value);
  };

  const handleDeleteChip = () => {
    void setSelected(null);
  };

  const toggleLabel = selected ? labelForValue(selected) : label;

  return (
    <ToolbarFilter
      labels={selected ? [labelForValue(selected)] : []}
      deleteLabel={handleDeleteChip}
      categoryName={label}
    >
      <SelectDropdown
        toggleText={toggleLabel}
        options={options}
        selected={selected}
        onSelect={handleSelect}
        data-test={`single-select-filter-${param}`}
      />
    </ToolbarFilter>
  );
};
