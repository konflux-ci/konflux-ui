import { useState } from 'react';
import { Divider, ToolbarFilter } from '@patternfly/react-core';
import {
  Select,
  SelectGroup,
  SelectOption,
  SelectVariant,
} from '@patternfly/react-core/deprecated';
import { FilterIcon } from '@patternfly/react-icons/dist/esm/icons/filter-icon';

export const MENU_DIVIDER = '--divider--';

type MultiSelectProps = {
  label: string;
  filterKey: string;
  placeholderText?: string;
  defaultExpanded?: boolean;
  toggleAriaLabel?: string;
  values: string[];
  setValues: (filters: string[]) => void;
  options: { [key: string]: number };
  /** Optional map from option key to display label. When provided, the option key is used as the value but the label is shown in the UI. */
  optionLabels?: Record<string, string>;
};

export const MultiSelect = ({
  label,
  filterKey,
  placeholderText,
  defaultExpanded,
  toggleAriaLabel,
  values,
  setValues,
  options,
  optionLabels,
}: MultiSelectProps) => {
  const [expanded, setExpanded] = useState(defaultExpanded ?? false);

  const chipLabels = optionLabels ? values.map((v) => optionLabels[v] ?? v) : values;
  const labelToKey = optionLabels
    ? Object.fromEntries(Object.entries(optionLabels).map(([k, v]) => [v, k]))
    : undefined;

  return (
    <ToolbarFilter
      chips={chipLabels}
      deleteChip={(_type, chip) => {
        const key = labelToKey ? labelToKey[chip as string] ?? chip : chip;
        setValues(values.filter((v) => v !== key));
      }}
      deleteChipGroup={() => {
        setValues([]);
      }}
      categoryName={label}
    >
      <Select
        placeholderText={placeholderText ?? label}
        toggleIcon={<FilterIcon />}
        toggleAriaLabel={toggleAriaLabel ?? `${label} filter menu`}
        variant={SelectVariant.checkbox}
        isOpen={expanded}
        onToggle={(_, exp: boolean) => setExpanded(exp)}
        onSelect={(event, selection) => {
          const checked = (event.target as HTMLInputElement).checked;
          setValues(
            checked
              ? [...values, String(selection)]
              : values.filter((value) => value !== selection),
          );
        }}
        selections={values}
        isGrouped
      >
        {[
          <SelectGroup label={label} key={filterKey}>
            {Object.keys(options).map((filter) =>
              filter.startsWith(MENU_DIVIDER) ? (
                <Divider key={filter} />
              ) : (
                <SelectOption
                  key={filter}
                  value={filter}
                  isChecked={values.includes(filter)}
                  // TODO: remove the item count from other components, it is not accurate anyway as it only counts fetched resources
                >
                  {optionLabels?.[filter] ?? filter}
                </SelectOption>
              ),
            )}
          </SelectGroup>,
        ]}
      </Select>
    </ToolbarFilter>
  );
};
