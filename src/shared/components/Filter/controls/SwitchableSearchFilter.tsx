import * as React from 'react';
import {
  Button,
  Chip,
  ChipGroup,
  InputGroup,
  InputGroupItem,
  MenuToggle,
  SearchInput,
  Select,
  SelectList,
  SelectOption,
  TextInputGroup,
  TextInputGroupMain,
  TextInputGroupUtilities,
  ToolbarItem,
} from '@patternfly/react-core';
import { TimesIcon } from '@patternfly/react-icons/dist/esm/icons/times-icon';
import { parseAsString, useQueryState, useQueryStates } from 'nuqs';
import { useDebounceCallback } from '~/shared/hooks/useDebounceCallback';
import { parseAsCommaSeparated } from '../parsers';
import { SwitchableSearchFilterConfig } from '../types';

const DEFAULT_DEBOUNCE = 600;

/** Props for {@link SwitchableSearchFilter}. */
type SwitchableSearchFilterProps<T> = {
  /** Switchable-search filter configuration. */
  config: SwitchableSearchFilterConfig<T>;
};

/**
 * Builds a nuqs parser map for each field's URL parameter.
 *
 * Multi-value fields use a comma-separated array parser; single-value
 * fields use the standard string parser.
 * @internal
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const buildFieldParsersMap = <T,>(config: SwitchableSearchFilterConfig<T>): Record<string, any> => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const map: Record<string, any> = {};
  for (const field of config.fields) {
    map[field.param] = field.multiValue ? parseAsCommaSeparated : parseAsString.withDefault('');
  }
  return map;
};

/** Chip-based input for multi-value switchable-search fields. @internal */
const ChipInput: React.FC<{
  values: string[];
  onAdd: (value: string) => void;
  onRemove: (value: string) => void;
  onClearAll: () => void;
  label: string;
  inputRef: React.RefObject<HTMLInputElement>;
}> = ({ values, onAdd, onRemove, onClearAll, label, inputRef }) => {
  const [inputValue, setInputValue] = React.useState('');

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault();
      const trimmed = inputValue.trim();
      if (!values.includes(trimmed)) {
        onAdd(trimmed);
      }
      setInputValue('');
    }
  };

  return (
    <TextInputGroup>
      <TextInputGroupMain
        ref={inputRef}
        value={inputValue}
        onChange={(_e, val) => setInputValue(val)}
        onKeyDown={handleKeyDown}
        aria-label={label}
        placeholder={values.length === 0 ? `Filter by ${label}...` : ''}
      >
        {values.length > 0 && (
          <ChipGroup>
            {values.map((v) => (
              <Chip key={v} onClick={() => onRemove(v)}>
                {v}
              </Chip>
            ))}
          </ChipGroup>
        )}
      </TextInputGroupMain>
      {values.length > 0 && (
        <TextInputGroupUtilities>
          <Button variant="plain" onClick={onClearAll} aria-label="Clear all">
            <TimesIcon />
          </Button>
        </TextInputGroupUtilities>
      )}
    </TextInputGroup>
  );
};

/**
 * Switchable-search filter control.
 *
 * Combines a field-picker dropdown with a debounced search input. The active
 * field selection is stored in one URL parameter; each field's search text
 * is stored in its own URL parameter. Switching fields clears the previous
 * field's value and focuses the search input.
 *
 * When a field has `multiValue: true`, a chip-based input is rendered instead
 * of a standard search input. Users type text and press Enter to add chips;
 * each chip can be removed individually.
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
  const isMultiValue = activeField.multiValue === true;

  const [localValue, setLocalValue] = React.useState(
    isMultiValue ? '' : (fieldValues[activeParam] as string) ?? '',
  );

  const searchInputRef = React.useRef<HTMLInputElement>(null);

  const debouncedSetUrl = useDebounceCallback((value: string) => {
    void setFieldValues({ [activeParam]: value || null });
  }, debounceMs);

  // Sync local state when URL changes externally (e.g., clearAll)
  React.useEffect(() => {
    if (!isMultiValue) {
      setLocalValue((fieldValues[activeParam] as string) ?? '');
    }
  }, [fieldValues, activeParam, isMultiValue]);

  const handleFieldSelect = (
    _event: React.MouseEvent | undefined,
    value: string | number | undefined,
  ) => {
    if (typeof value !== 'string') return;

    // Clear previous field's URL param (works for both string and array)
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

  // Multi-value handlers — updates go directly to URL (no debounce)
  const multiValues: string[] = isMultiValue
    ? (fieldValues[activeParam] as unknown as string[]) ?? []
    : [];

  const handleChipAdd = (value: string) => {
    const updated = [...multiValues, value];
    void setFieldValues({ [activeParam]: updated });
  };

  const handleChipRemove = (value: string) => {
    const updated = multiValues.filter((v) => v !== value);
    void setFieldValues({ [activeParam]: updated.length > 0 ? updated : null });
  };

  const handleChipClearAll = () => {
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
          {isMultiValue ? (
            <ChipInput
              values={multiValues}
              onAdd={handleChipAdd}
              onRemove={handleChipRemove}
              onClearAll={handleChipClearAll}
              label={activeField.label}
              inputRef={searchInputRef}
            />
          ) : (
            <SearchInput
              ref={searchInputRef}
              aria-label={activeField.label}
              placeholder={`Filter by ${activeField.label}...`}
              value={localValue}
              onChange={handleSearchChange}
              onClear={handleClear}
            />
          )}
        </InputGroupItem>
      </InputGroup>
    </ToolbarItem>
  );
};
