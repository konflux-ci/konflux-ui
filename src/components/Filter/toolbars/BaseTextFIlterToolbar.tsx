import { Children } from 'react';
import { Button, SearchInput, Toolbar, ToolbarContent, ToolbarItem } from '@patternfly/react-core';
import { CogIcon } from '@patternfly/react-icons/dist/esm/icons/cog-icon';
import { debounce } from 'lodash-es';
import { IfFeature } from '~/feature-flags/hooks';

type BaseTextFilterToolbarProps = {
  text: string;
  label: string;
  setText: (string) => void;
  onClearFilters: () => void;
  children?: React.ReactNode;
  dataTest?: string;
  openColumnManagement?: () => void;
  totalColumns?: number;
};

export const BaseTextFilterToolbar = ({
  text,
  label,
  setText,
  onClearFilters,
  children,
  dataTest,
  openColumnManagement,
  totalColumns = 0,
}: BaseTextFilterToolbarProps) => {
  const onTextInput = debounce((newName: string) => {
    setText(newName);
  }, 600);

  // Create column management button
  const columnManagementButton = () => (
    <IfFeature flag="column-management">
      <Button
        variant="plain"
        aria-label="Manage columns"
        onClick={openColumnManagement}
        icon={<CogIcon />}
      >
        Manage columns
      </Button>
    </IfFeature>
  );

  return (
    <>
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
          {openColumnManagement && totalColumns > 6 && (
            <ToolbarItem>{columnManagementButton()}</ToolbarItem>
          )}
        </ToolbarContent>
      </Toolbar>
    </>
  );
};
