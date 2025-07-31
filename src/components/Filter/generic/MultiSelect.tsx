import { useState } from 'react';
import { ToolbarFilter } from '@patternfly/react-core';
import {
  Select,
  SelectGroup,
  SelectOption,
  SelectVariant,
} from '@patternfly/react-core/deprecated';
import { FilterIcon } from '@patternfly/react-icons/dist/esm/icons/filter-icon';

type MultiSelectProps = {
  label: string;
  filterKey: string;
  placeholderText?: string;
  defaultExpanded?: boolean;
  toggleAriaLabel?: string;
  values: string[];
  setValues: (filters: string[]) => void;
  options: { [key: string]: number };
  valueLabels?: { [key: string]: string }; // Optional mapping of values to display labels
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
  valueLabels,
}: MultiSelectProps) => {
  const [expanded, setExpanded] = useState(defaultExpanded ?? false);

  const chipLabels = values.map((value) => valueLabels?.[value] || value);

  return (
    <ToolbarFilter
      chips={chipLabels}
      deleteChip={(_type, chip) => {
        const originalValue =
          values.find((value) => (valueLabels?.[value] || value) === chip) ?? chip;
        setValues(values.filter((v) => v !== originalValue));
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
            {Object.keys(options).map((filter) => (
              <SelectOption
                key={filter}
                value={filter}
                isChecked={values.includes(filter)}
                itemCount={options[filter] ?? 0}
              >
                {valueLabels?.[filter] || filter.charAt(0).toUpperCase() + filter.slice(1)}
              </SelectOption>
            ))}
          </SelectGroup>,
        ]}
      </Select>
    </ToolbarFilter>
  );
};
