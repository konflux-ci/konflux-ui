import * as React from 'react';
import { SearchInput } from '@patternfly/react-core';
import { useDebounceCallback } from '~/shared/hooks/useDebounceCallback';

interface SearchFilterProps {
  value: string;
  onChange: (value: string) => void;
}

export const SearchFilter: React.FC<SearchFilterProps> = ({ value, onChange }) => {
  const [localSearchValue, setLocalSearchValue] = React.useState(value);

  const localSearchValueRef = React.useRef(localSearchValue);

  React.useEffect(() => {
    localSearchValueRef.current = localSearchValue;
  }, [localSearchValue]);

  const debouncedOnChange = useDebounceCallback(
    React.useCallback(
      (nextValue: string) => {
        onChange(nextValue);
      },
      [onChange],
    ),
  );

  React.useEffect(() => {
    if (value !== localSearchValueRef.current) {
      setLocalSearchValue(value);
      debouncedOnChange.cancel();
    }
  }, [value, debouncedOnChange]);

  const handleLocalChange = (_: React.FormEvent<HTMLInputElement>, v: string) => {
    setLocalSearchValue(v);
    debouncedOnChange(v);
  };

  const handleClear = () => {
    setLocalSearchValue('');
    onChange('');
    debouncedOnChange.cancel();
  };

  React.useEffect(() => {
    return () => {
      debouncedOnChange.cancel();
    };
  }, [debouncedOnChange]);

  return (
    <SearchInput
      placeholder="Search by release plan"
      value={localSearchValue}
      onChange={handleLocalChange} // debunce and wait next input
      onClear={handleClear} // clear and debunce
    />
  );
};
