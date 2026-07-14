import * as React from 'react';
import {
  Badge,
  Divider,
  MenuSearch,
  MenuSearchInput,
  MenuToggle,
  SearchInput,
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
  hasInlineFilter?: boolean;
  inlineFilterPlaceholderText?: string;
  inlineFilterThreshold?: number;
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
  hasInlineFilter = false,
  inlineFilterPlaceholderText,
  inlineFilterThreshold = 20,
}: MultiSelectProps) => {
  const [expanded, setExpanded] = React.useState(defaultExpanded ?? false);
  const [filterValue, setFilterValue] = React.useState('');

  const showInlineFilter = React.useMemo(() => {
    if (!hasInlineFilter) return false;
    const itemCount = options.filter((o) => !o.key.startsWith(MENU_DIVIDER)).length;
    return itemCount > inlineFilterThreshold;
  }, [hasInlineFilter, options, inlineFilterThreshold]);

  const selectOptions = React.useMemo(() => {
    const lowerFilter = filterValue?.toLowerCase();

    return options
      .filter((option) => {
        if (!showInlineFilter) return true;
        if (!filterValue?.trim()) return true;
        return (
          !option.key.startsWith(MENU_DIVIDER) &&
          (option.label ?? option.key).toLowerCase().includes(lowerFilter)
        );
      })
      .map((option) =>
        option.key.startsWith(MENU_DIVIDER) ? (
          <Divider component="li" key={option.key} />
        ) : (
          <SelectOption
            hasCheckbox
            key={option.key}
            value={option.key}
            isSelected={values.includes(option.key)}
          >
            {option.label ?? option.key}
          </SelectOption>
        ),
      );
  }, [filterValue, options, showInlineFilter, values]);

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
      chips={chipLabels}
      deleteChip={(_type, chip) => {
        const key = labelToKey[chip as string] ?? chip;
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
            onClick={() => {
              setExpanded(!expanded);
              if (showInlineFilter) {
                setFilterValue('');
              }
            }}
            isExpanded={expanded}
            icon={<FilterIcon />}
            aria-label={toggleAriaLabel ?? `${label} filter menu`}
          >
            {placeholderText ?? label}
            {values.length > 0 && <Badge isRead>{values.length}</Badge>}
          </MenuToggle>
        )}
        isScrollable
      >
        {showInlineFilter && (
          <MenuSearch>
            <MenuSearchInput>
              <SearchInput
                value={filterValue}
                onChange={(_event, value) => setFilterValue(value)}
                placeholder={inlineFilterPlaceholderText ?? `Filter ${label.toLowerCase()}`}
                aria-label={inlineFilterPlaceholderText ?? `Filter ${label.toLowerCase()}`}
              />
            </MenuSearchInput>
          </MenuSearch>
        )}
        <SelectGroup label={label} key={filterKey}>
          <SelectList>{selectOptions}</SelectList>
        </SelectGroup>
      </Select>
    </ToolbarFilter>
  );
};

export const MultiSelect = React.memo(MultiSelectComponent);
