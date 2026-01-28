import * as React from 'react';
import { SearchInput, Toolbar, ToolbarContent, ToolbarItem } from '@patternfly/react-core';
import { IfFeature } from '~/feature-flags/hooks';
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
  const onTextInput = useDebounceCallback((value: string) => {
    setText(value);
  }, 600);

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
