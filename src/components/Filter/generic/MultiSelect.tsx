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
  options: { key: string; count?: number; label?: string }[];
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

  const chipLabels = values.map((v) => options.find((o) => o.key === v)?.label ?? v);
  const labelToKey = options.reduce(
    (acc, curr) => {
      acc[curr.label ?? curr.key] = curr.key;
      return acc;
    },
    {} as Record<string, string>,
  );

  return (
    <ToolbarFilter
      labels={chipLabels}
      deleteLabel={(_type, chip) => {
        const key = labelToKey ? labelToKey[chip as string] ?? chip : chip;
        setValues(values.filter((v) => v !== key));
      }}
      deleteLabelGroup={() => {
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
            {options.map((filter) =>
              filter.key.startsWith(MENU_DIVIDER) ? (
                <Divider component="li" key={filter.key} />
              ) : (
                <SelectOption
                  hasCheckbox
                  key={filter.key}
                  value={filter.key}
                  isSelected={values.includes(filter.key)}
                >
                  {filter.label ?? filter.key}
                </SelectOption>
              ),
            )}
          </SelectList>
        </SelectGroup>
      </Select>
    </ToolbarFilter>
  );
};
