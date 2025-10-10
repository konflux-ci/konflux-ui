import * as React from 'react';
import { SearchInput, Toolbar, ToolbarContent, ToolbarItem } from '@patternfly/react-core';
import { debounce } from 'lodash-es';
import ColumnManagementButton from '../components/ColumnManagementButton';

type BaseTextFilterToolbarProps = {
  text: string;
  label: string;
  setText: (value: string) => void;
  onClearFilters: () => void;
  children?: React.ReactNode;
  dataTest?: string;
  openColumnManagement?: () => void;
  totalColumns?: number;
  showSearchInput?: boolean;
};

export const BaseTextFilterToolbar: React.FC<BaseTextFilterToolbarProps> = ({
  text,
  label,
  setText,
  onClearFilters,
  children,
  dataTest,
  openColumnManagement,
  totalColumns = 0,
  showSearchInput = true,
}) => {
  // keep the latest setText in a ref
  const setTextRef = React.useRef(setText);
  React.useEffect(() => {
    setTextRef.current = setText;
  }, [setText]);

  // stable debounced function that calls the *latest* setTextRef
  const onTextInput = React.useMemo(
    () =>
      debounce((newName: string) => {
        setTextRef.current(newName);
      }, 600),
    [],
  );

  //React.useEffect(() => {
  //  return () => onTextInput.cancel();
  //}, [onTextInput]);

  return (
    <Toolbar data-test={dataTest} usePageInsets clearAllFilters={onClearFilters}>
      <ToolbarContent>
        {showSearchInput && (
          <ToolbarItem className="pf-v5-u-ml-0">
            <SearchInput
              name={`${label}Input`}
              data-test={`${label}-input-filter`}
              type="search"
              aria-label={`${label} filter`}
              placeholder={`Filter by ${label}...`}
              onChange={(_, value) => onTextInput(value)}
              value={text}
            />
          </ToolbarItem>
        )}
        {React.Children.map(children, (child, index) => (
          <ToolbarItem key={index}>{child}</ToolbarItem>
        ))}
        <ToolbarItem>
          <ColumnManagementButton onClick={openColumnManagement} totalColumns={totalColumns} />
        </ToolbarItem>
      </ToolbarContent>
    </Toolbar>
  );
};
