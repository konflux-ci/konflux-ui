import * as React from 'react';
import {
  InputGroup,
  InputGroupItem,
  MenuToggle,
  SearchInput,
  Select,
  SelectList,
  SelectOption,
  ToolbarItem,
} from '@patternfly/react-core';
import { parseAsString, useQueryState, useQueryStates } from 'nuqs';
import { useDebounceCallback } from '~/shared/hooks/useDebounceCallback';
import { SwitchableSearchFilterConfig } from '../types';

const DEFAULT_DEBOUNCE = 600;

/** Props for {@link SwitchableSearchFilter}. */
type SwitchableSearchFilterProps<T> = {
  /** Switchable-search filter configuration. */
  config: SwitchableSearchFilterConfig<T>;
};

/**
 * Builds a nuqs parser map for each field's URL parameter.
 * @internal
 */
const buildFieldParsersMap = <T,>(config: SwitchableSearchFilterConfig<T>) => {
  const map: Record<string, ReturnType<typeof parseAsString.withDefault>> = {};
  for (const field of config.fields) {
    map[field.param] = parseAsString.withDefault('');
  }
  return map;
};

/**
 * Switchable-search filter control.
 *
 * Combines a field-picker dropdown with a debounced search input. The active
 * field selection is stored in one URL parameter; each field's search text
 * is stored in its own URL parameter. Switching fields clears the previous
 * field's value and focuses the search input.
 *
 * @typeParam T - The data-item type being filtered.
 */
export const SwitchableSearchFilter = <T,>({ config }: SwitchableSearchFilterProps<T>) => {
  const { param, fields, debounce: debounceMs = DEFAULT_DEBOUNCE } = config;

  const [isOpen, setIsOpen] = React.useState(false);

  const [activeFieldValue, setActiveFieldValue] = useQueryState(
    param,
    parseAsString.withDefault(fields[0]?.value ?? ''),
  );

  const fieldParsersMap = React.useMemo(() => buildFieldParsersMap(config), [config]);
  const [fieldValues, setFieldValues] = useQueryStates(fieldParsersMap);

  const activeField = fields.find((f) => f.value === activeFieldValue) ?? fields[0];
  const activeParam = activeField.param;

  const [localValue, setLocalValue] = React.useState(fieldValues[activeParam] ?? '');

  const searchInputRef = React.useRef<HTMLInputElement>(null);

  const debouncedSetUrl = useDebounceCallback((value: string) => {
    void setFieldValues({ [activeParam]: value || null });
  }, debounceMs);

  // Sync local state when URL changes externally (e.g., clearAll)
  React.useEffect(() => {
    setLocalValue(fieldValues[activeParam] ?? '');
  }, [fieldValues, activeParam]);

  const handleFieldSelect = (
    _event: React.MouseEvent | undefined,
    value: string | number | undefined,
  ) => {
    if (typeof value !== 'string') return;

    // Clear previous field's URL param
    void setFieldValues({ [activeParam]: null });
    // Update selector to new field
    void setActiveFieldValue(value === fields[0]?.value ? null : value);

    // Reset local search value and cancel debounce
    setLocalValue('');
    debouncedSetUrl.cancel();

    setIsOpen(false);

    // Focus search input
    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 0);
  };

  const handleSearchChange = (_event: React.FormEvent<HTMLInputElement>, value: string) => {
    setLocalValue(value);
    debouncedSetUrl(value);
  };

  const handleClear = () => {
    debouncedSetUrl.cancel();
    setLocalValue('');
    void setFieldValues({ [activeParam]: null });
  };

  const toggle = (toggleRef: React.Ref<HTMLButtonElement>) => (
    <MenuToggle ref={toggleRef} onClick={() => setIsOpen((prev) => !prev)} isExpanded={isOpen}>
      {activeField.label}
    </MenuToggle>
  );

  return (
    <ToolbarItem data-test={`switchable-search-filter-${param}`}>
      <InputGroup>
        <InputGroupItem>
          <Select
            role="menu"
            isOpen={isOpen}
            onSelect={handleFieldSelect}
            onOpenChange={setIsOpen}
            toggle={toggle}
          >
            <SelectList>
              {fields.map((field) => (
                <SelectOption
                  key={field.value}
                  value={field.value}
                  isSelected={field.value === activeFieldValue}
                >
                  {field.label}
                </SelectOption>
              ))}
            </SelectList>
          </Select>
        </InputGroupItem>
        <InputGroupItem isFill>
          <SearchInput
            ref={searchInputRef}
            aria-label={activeField.label}
            placeholder={`Filter by ${activeField.label}...`}
            value={localValue}
            onChange={handleSearchChange}
            onClear={handleClear}
          />
        </InputGroupItem>
      </InputGroup>
    </ToolbarItem>
  );
};
