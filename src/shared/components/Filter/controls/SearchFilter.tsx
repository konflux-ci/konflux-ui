import * as React from 'react';
import { SearchInput, ToolbarItem } from '@patternfly/react-core';
import { parseAsString, useQueryState } from 'nuqs';
import { useDebounceCallback } from '~/shared/hooks/useDebounceCallback';
import { SearchFilterConfig } from '../types';

const DEFAULT_DEBOUNCE = 600;

/** Props for {@link SearchFilter}. */
type SearchFilterProps<T> = {
  /** Search filter configuration. */
  config: SearchFilterConfig<T>;
};

/**
 * Text-search filter control.
 *
 * Renders a `SearchInput` that writes a debounced value to a URL parameter
 * via nuqs. Local state keeps the input responsive while the URL update
 * is debounced.
 *
 * @typeParam T - The data-item type being filtered.
 */
export const SearchFilter = <T,>({ config }: SearchFilterProps<T>) => {
  const { param, label, placeholder, debounce: debounceMs = DEFAULT_DEBOUNCE } = config;

  const [urlValue, setUrlValue] = useQueryState(param, parseAsString.withDefault(''));
  const [localValue, setLocalValue] = React.useState(urlValue);

  const debouncedSetUrl = useDebounceCallback((value: string) => {
    void setUrlValue(value || null);
  }, debounceMs);

  // Sync local state when URL changes externally (e.g., clearAll)
  React.useEffect(() => {
    setLocalValue(urlValue);
  }, [urlValue]);

  const handleChange = (_event: React.FormEvent<HTMLInputElement>, value: string) => {
    setLocalValue(value);
    debouncedSetUrl(value);
  };

  const handleClear = () => {
    debouncedSetUrl.cancel();
    setLocalValue('');
    void setUrlValue(null);
  };

  return (
    <ToolbarItem>
      <SearchInput
        aria-label={label}
        data-test={`search-filter-${param}`}
        placeholder={placeholder ?? `Filter by ${label}...`}
        value={localValue}
        onChange={handleChange}
        onClear={handleClear}
      />
    </ToolbarItem>
  );
};
