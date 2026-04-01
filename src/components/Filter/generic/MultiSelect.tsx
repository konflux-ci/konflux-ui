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
  /** Optional map from option key to display label. When provided, the option key is used as the value but the label is shown in the UI. */
  optionLabels?: Record<string, string>;
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
  optionLabels,
  hasInlineFilter = false,
  inlineFilterPlaceholderText,
  inlineFilterThreshold = 20,
}: MultiSelectProps) => {
  const [expanded, setExpanded] = React.useState(defaultExpanded ?? false);

  // Determine if inline filter should be shown based on threshold
  const showInlineFilter = React.useMemo(() => {
    if (!hasInlineFilter) return false;
    const itemCount = Object.keys(options).filter((key) => !key.startsWith(MENU_DIVIDER)).length;
    return itemCount > inlineFilterThreshold;
  }, [hasInlineFilter, options, inlineFilterThreshold]);

  // Memoize the options to prevent re-creating them on every render
  const selectOptions = React.useMemo(() => {
    return Object.keys(options).map((filter) =>
      filter.startsWith(MENU_DIVIDER) ? (
        <Divider key={filter} />
      ) : (
        <SelectOption key={filter} value={filter} itemCount={options[filter] ?? 0}>
          {optionLabels?.[filter] ?? filter}
        </SelectOption>
      ),
    );
  }, [optionLabels, options]);

  const onFilter = React.useCallback(
    (_event: React.ChangeEvent<HTMLInputElement> | null, value: string) => {
      const keys = Object.keys(options);
      const lowerFilter = value?.toLowerCase();

      return keys
        .filter((key) => {
          if (!value?.trim()) return true;
          return !key.startsWith(MENU_DIVIDER) && key.toLowerCase().includes(lowerFilter);
        })
        .map((filter) =>
          filter.startsWith(MENU_DIVIDER) ? (
            <Divider key={filter} />
          ) : (
            <SelectOption key={filter} value={filter} itemCount={options[filter] ?? 0}>
              {optionLabels?.[filter] ?? filter}
            </SelectOption>
          ),
        );
    },
    [optionLabels, options],
  );

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
        onToggle={(_, exp: boolean) => {
          setExpanded(exp);
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
        {...(showInlineFilter && {
          hasInlineFilter: true,
          onFilter,
          inlineFilterPlaceholderText:
            inlineFilterPlaceholderText ?? `Filter ${label.toLowerCase()}`,
        })}
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
