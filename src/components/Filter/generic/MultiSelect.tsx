import * as React from 'react';
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
  allowCustomValues?: boolean;
};

const MultiSelectComponent = ({
  label,
  filterKey,
  placeholderText,
  defaultExpanded,
  toggleAriaLabel,
  values,
  setValues,
  options,
}: MultiSelectProps) => {
  const [expanded, setExpanded] = React.useState(defaultExpanded ?? false);
  const [filterValue, setFilterValue] = React.useState('');

  // Function to create options based on filter text
  const createFilteredOptions = React.useCallback(
    (filterText: string) => {
      const keys = Object.keys(options);
      const lowerFilter = filterText.toLowerCase();

      return keys
        .filter((key) => {
          if (!filterText.trim()) return true;
          return !key.startsWith(MENU_DIVIDER) && key.toLowerCase().includes(lowerFilter);
        })
        .map((filter) =>
          filter.startsWith(MENU_DIVIDER) ? (
            <Divider key={filter} />
          ) : (
            <SelectOption
              key={filter}
              value={filter}
              itemCount={options[filter] ?? 0}
            >
              {filter}
            </SelectOption>
          ),
        );
    },
    [options],
  );

  // Memoize the options to prevent re-creating them on every render
  const selectOptions = React.useMemo(() => {
    return createFilteredOptions(filterValue);
  }, [createFilteredOptions, filterValue]);

  const onFilter = React.useCallback(
    (_event: React.ChangeEvent<HTMLInputElement> | null, value: string) => {
      setFilterValue(value);
      // Return freshly calculated options based on the new filter value
      return createFilteredOptions(value);
    },
    [createFilteredOptions],
  );

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
        onToggle={(_, exp: boolean) => {
          setExpanded(exp);
          // Reset filter when opening or closing to ensure fresh state
          setFilterValue('');
        }}
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
        hasInlineFilter
        onFilter={onFilter}
        inlineFilterPlaceholderText={`Filter ${label.toLowerCase()}`}
        maxHeight="400px"
      >
        {[
          <SelectGroup label={label} key={filterKey}>
            {selectOptions}
          </SelectGroup>,
        ]}
      </Select>
    </ToolbarFilter>
  );
};

export const MultiSelect = React.memo(MultiSelectComponent);
