import React from 'react';
import { SearchInput, Toolbar, ToolbarContent, ToolbarItem } from '@patternfly/react-core';

type Props = {
  value?: string;
  onSearchInputChange: (value: string) => void;
};

export const ReleaseArtifactsToolbar: React.FC<Props> = ({ value, onSearchInputChange }) => {
  return (
    <Toolbar usePageInsets>
      <ToolbarContent>
        <ToolbarItem className="pf-v5-u-ml-0">
          <SearchInput
            name="nameInput"
            data-test="name-input-filter"
            type="search"
            aria-label="name filter"
            placeholder="Filter by name..."
            onChange={(_, n) => onSearchInputChange(n)}
            value={value}
          />
        </ToolbarItem>
      </ToolbarContent>
    </Toolbar>
  );
};
