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
}: MultiSelectProps) => {
  const [expanded, setExpanded] = useState(defaultExpanded ?? false);

  return (
    <ToolbarFilter
      chips={values}
      deleteChip={(_type, chip) => {
        setValues(values.filter((v) => v !== chip));
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
                {filter}
              </SelectOption>
            ))}
          </SelectGroup>,
        ]}
      </Select>
    </ToolbarFilter>
  );
};
