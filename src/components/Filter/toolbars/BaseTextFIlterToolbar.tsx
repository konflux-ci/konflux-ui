import * as React from 'react';
import {
  Dropdown,
  DropdownItem,
  DropdownList,
  InputGroup,
  InputGroupItem,
  MenuToggle,
  MenuToggleElement,
  SearchInput,
  Toolbar,
  ToolbarContent,
  ToolbarItem,
} from '@patternfly/react-core';
import { IfFeature } from '~/feature-flags/hooks';
import { useDebounceCallback } from '../../../shared/hooks/useDebounceCallback';
import ColumnManagementButton from '../components/ColumnManagementButton';

type BaseTextFilterToolbarProps = {
  text: string;
  label: string;
  setText: (value: string, type: string) => void;
  onClearFilters: () => void;
  children?: React.ReactNode;
  dataTest?: string;
  openColumnManagement?: () => void;
  totalColumns?: number;
  showSearchInput?: boolean;
  noLeftPadding?: boolean;
  filterOptions?: string[];
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
  noLeftPadding = false,
  filterOptions = [],
}) => {
  const [isOpen, setIsOpen] = React.useState<boolean>(false);
  const [searchOption, setSearchOption] = React.useState<string>(filterOptions?.[0] ?? '');
  const onTextInput = useDebounceCallback((value: string) => {
    setText(value, searchOption);
  }, 600);

  const searchInput = React.useMemo(
    () => (
      <SearchInput
        name={`${label}Input`}
        data-test={`${label}-input-filter`}
        type="search"
        aria-label={`${label} filter`}
        placeholder={`Filter by ${filterOptions.length > 0 ? searchOption.toLocaleLowerCase() : label}...`}
        onChange={(_, value) => onTextInput(value)}
        value={text}
      />
    ),
    [text, label, onTextInput, searchOption, filterOptions],
  );

  const searchGroup = React.useMemo(
    () => (
      <InputGroup>
        <InputGroupItem>
          <Dropdown
            isOpen={isOpen}
            onSelect={(_, value) => {
              setSearchOption(value as string);
              setIsOpen(false);
            }}
            toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
              <MenuToggle ref={toggleRef} onClick={() => setIsOpen(!isOpen)} isExpanded={isOpen}>
                {searchOption}
              </MenuToggle>
            )}
          >
            <DropdownList>
              {filterOptions.map((option) => (
                <DropdownItem key={option} value={option}>
                  {option}
                </DropdownItem>
              ))}
            </DropdownList>
          </Dropdown>
        </InputGroupItem>
        <InputGroupItem isFill>{searchInput}</InputGroupItem>
      </InputGroup>
    ),
    [filterOptions, isOpen, searchInput, searchOption],
  );

  return (
    <Toolbar data-test={dataTest} usePageInsets clearAllFilters={onClearFilters}>
      <ToolbarContent style={{ paddingLeft: noLeftPadding ? '0' : undefined }}>
        {showSearchInput && (
          <ToolbarItem className="pf-v5-u-ml-0">
            {filterOptions.length > 0 ? searchGroup : searchInput}
          </ToolbarItem>
        )}
        {React.Children.map(children, (child, index) => (
          <ToolbarItem alignSelf="center" key={index}>
            {child}
          </ToolbarItem>
        ))}
        <IfFeature flag="column-management">
          <ToolbarItem>
            <ColumnManagementButton onClick={openColumnManagement} totalColumns={totalColumns} />
          </ToolbarItem>
        </IfFeature>
      </ToolbarContent>
    </Toolbar>
  );
};
