import * as React from 'react';
import {
  capitalize,
  InputGroup,
  InputGroupItem,
  MenuToggle,
  SearchInput,
  Select,
  SelectList,
  SelectOption,
  Toolbar,
  ToolbarContent,
  ToolbarItem,
} from '@patternfly/react-core';
import { FilterIcon } from '@patternfly/react-icons/dist/esm/icons';
import { useDebounceCallback } from '../../../shared/hooks/useDebounceCallback';
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
  filterOptions?: string[];
  selectedFilterOption?: string;
  onFilterTypeChange?: (filterType: string) => void;
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
  filterOptions,
  selectedFilterOption,
  onFilterTypeChange,
}) => {
  const onTextInput = useDebounceCallback((value: string) => {
    setText(value);
  }, 600);

  const [isOpen, setIsOpen] = React.useState(false);
  const hasMultipleOptions = filterOptions && filterOptions.length > 1;
  // Use provided selectedFilterOption or first option as default
  const [selectedFilterType, setSelectedFilterType] = React.useState<string>(
    selectedFilterOption || filterOptions?.[0] || label,
  );

  // Sync with parent's selectedFilterOption
  React.useEffect(() => {
    if (selectedFilterOption && selectedFilterOption !== selectedFilterType) {
      setSelectedFilterType(selectedFilterOption);
    }
  }, [selectedFilterOption, selectedFilterType]);

  // Update selectedFilterType when filterOptions changes
  React.useEffect(() => {
    if (filterOptions && filterOptions.length > 0 && !filterOptions.includes(selectedFilterType)) {
      setSelectedFilterType(filterOptions[0]);
    }
  }, [filterOptions, selectedFilterType]);

  const currentLabel = selectedFilterType || label;

  return (
    <Toolbar data-test={dataTest} usePageInsets clearAllFilters={onClearFilters}>
      <ToolbarContent>
        {showSearchInput && (
          <ToolbarItem className="pf-v5-u-ml-0">
            {hasMultipleOptions ? (
              <InputGroup>
                <InputGroupItem>
                  <Select
                    toggle={(toggleRef) => (
                      <MenuToggle
                        ref={toggleRef}
                        icon={<FilterIcon />}
                        isExpanded={isOpen}
                        onClick={() => setIsOpen((prev) => !prev)}
                      >
                        {capitalize(currentLabel)}
                      </MenuToggle>
                    )}
                    onSelect={(_, value) => {
                      const selectedValue = typeof value === 'string' ? value : String(value);
                      if (selectedValue && filterOptions?.includes(selectedValue)) {
                        setSelectedFilterType(selectedValue);
                        onFilterTypeChange?.(selectedValue);
                        setIsOpen(false);
                      }
                    }}
                    selected={selectedFilterType}
                    isOpen={isOpen}
                    onOpenChange={(isOpenState) => setIsOpen(isOpenState)}
                  >
                    <SelectList>
                      {filterOptions.map((ft) => (
                        <SelectOption key={ft} value={ft}>
                          {capitalize(ft)}
                        </SelectOption>
                      ))}
                    </SelectList>
                  </Select>
                </InputGroupItem>
                <InputGroupItem isFill>
                  <SearchInput
                    name={`${currentLabel}Input`}
                    data-test={`${currentLabel}-input-filter`}
                    type="search"
                    aria-label={`${currentLabel} filter`}
                    placeholder={`Filter by ${currentLabel}...`}
                    onChange={(_, value) => onTextInput(value)}
                    onClear={() => onTextInput('')}
                    value={text}
                  />
                </InputGroupItem>
              </InputGroup>
            ) : (
              <SearchInput
                name={`${label}Input`}
                data-test={`${label}-input-filter`}
                type="search"
                aria-label={`${label} filter`}
                placeholder={`Filter by ${label}...`}
                onChange={(_, value) => onTextInput(value)}
                value={text}
              />
            )}
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
