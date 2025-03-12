import { Children } from 'react';
import { SearchInput, Toolbar, ToolbarContent, ToolbarItem } from '@patternfly/react-core';
import { debounce } from 'lodash-es';

type NameFilterToolbarProps = {
  name: string;
  setName: (string) => void;
  onClearFilters: () => void;
  children?: React.ReactNode;
};

export const NameFilterToolbar = ({
  name,
  setName,
  onClearFilters,
  children,
}: NameFilterToolbarProps) => {
  const onNameInput = debounce((newName: string) => {
    setName(newName);
  }, 600);

  return (
    <Toolbar usePageInsets clearAllFilters={onClearFilters}>
      <ToolbarContent>
        <ToolbarItem className="pf-v5-u-ml-0">
          <SearchInput
            name="nameInput"
            data-test="name-input-filter"
            type="search"
            aria-label="name filter"
            placeholder="Filter by name..."
            onChange={(_, n) => onNameInput(n)}
            value={name}
          />
        </ToolbarItem>
        {Children.map(children, (child, index) => (
          <ToolbarItem key={index}>{child}</ToolbarItem>
        ))}
      </ToolbarContent>
    </Toolbar>
  );
};
