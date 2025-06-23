import { Children } from 'react';
import { SearchInput, Toolbar, ToolbarContent, ToolbarItem } from '@patternfly/react-core';
import { debounce } from 'lodash-es';

type BaseTextFilterToolbarProps = {
  text: string;
  label: string;
  setText: (text: string) => void;
  onClearFilters: () => void;
  children?: React.ReactNode;
  dataTest?: string;
};

export const BaseTextFilterToolbar = ({
  text,
  label,
  setText,
  onClearFilters,
  children,
  dataTest,
}: BaseTextFilterToolbarProps) => {
  const onTextInput = debounce((newName: string) => {
    setText(newName);
  }, 600);

  return (
    <Toolbar data-test={dataTest} usePageInsets clearAllFilters={onClearFilters}>
      <ToolbarContent>
        <ToolbarItem className="pf-v5-u-ml-0">
          <SearchInput
            name={`${label}Input`}
            data-test={`${label}-input-filter`}
            type="search"
            aria-label={`${label} filter`}
            placeholder={`Filter by ${label}...`}
            onChange={(_, n) => onTextInput(n)}
            value={text}
          />
        </ToolbarItem>
        {Children.map(children, (child, index) => (
          <ToolbarItem key={index}>{child}</ToolbarItem>
        ))}
      </ToolbarContent>
    </Toolbar>
  );
};
