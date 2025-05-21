import * as React from 'react';
import { SearchInput } from '@patternfly/react-core';
interface SearchFilterProps {
  value: string;
  onChange: (value: string) => void;
}

export const SearchFilter: React.FC<SearchFilterProps> = ({ value, onChange }) => {
  return (
    <SearchInput
      placeholder="Search by release plan"
      value={value}
      onChange={(_, v) => onChange(v)}
      onClear={() => onChange('')} // clear and debunce
    />
  );
};
