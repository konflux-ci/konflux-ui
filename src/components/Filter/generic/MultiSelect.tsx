import { useState } from 'react';
import {
  Badge,
  Divider,
  MenuToggle,
  Select,
  SelectGroup,
  SelectList,
  SelectOption,
  ToolbarFilter,
} from '@patternfly/react-core';
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
        role="menu"
        isOpen={expanded}
        selected={values}
        onSelect={(_, selection) => {
          const value = String(selection);
          setValues(
            values.includes(value) ? values.filter((v) => v !== value) : [...values, value],
          );
        }}
        onOpenChange={setExpanded}
        toggle={(toggleRef) => (
          <MenuToggle
            ref={toggleRef}
            onClick={() => setExpanded(!expanded)}
            isExpanded={expanded}
            icon={<FilterIcon />}
            aria-label={toggleAriaLabel ?? `${label} filter menu`}
          >
            {placeholderText ?? label}
            {values.length > 0 && <Badge isRead>{values.length}</Badge>}
          </MenuToggle>
        )}
      >
        <SelectGroup label={label} key={filterKey}>
          <SelectList>
            {Object.keys(options).map((filter) =>
              filter.startsWith(MENU_DIVIDER) ? (
                <Divider key={filter} />
              ) : (
                <SelectOption
                  hasCheckbox
                  key={filter}
                  value={filter}
                  isSelected={values.includes(filter)}
                >
                  {optionLabels?.[filter] ?? filter}
                </SelectOption>
              ),
            )}
          </SelectList>
        </SelectGroup>
      </Select>
    </ToolbarFilter>
  );
};
