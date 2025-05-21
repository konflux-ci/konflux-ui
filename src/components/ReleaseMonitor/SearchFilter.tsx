import * as React from 'react';
import { SearchInput } from '@patternfly/react-core';
import { useDebounceCallback } from '~/shared/hooks/useDebounceCallback';

interface SearchFilterProps {
  value: string;
  onChange: (value: string) => void;
}

export const SearchFilter: React.FC<SearchFilterProps> = ({ value, onChange }) => {
  const [, setValidating] = React.useState(false);
  const [localValue, setLocalValue] = React.useState(value);

  const debouncedValidate = useDebounceCallback(
    React.useCallback(async () => {
      setValidating(true);

      if (value === localValue) {
        setValidating(false);
        return;
      }

      await Promise.resolve();

      setValidating(false);
    }, [value, localValue]),
  );

  React.useEffect(() => {
    if (value !== localValue) {
      setLocalValue(value);
    }
  }, [value, localValue]);

  return (
    <SearchInput
      placeholder="Search by release plan"
      value={localValue}
      onChange={(_, v) => {
        onChange(v);
        void debouncedValidate();
      }}
      onClear={() => onChange('')}
    />
  );
};
