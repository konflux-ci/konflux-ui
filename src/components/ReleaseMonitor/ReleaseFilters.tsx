import * as React from 'react';
import {
  Toolbar,
  ToolbarContent,
  ToolbarItem,
  ToolbarToggleGroup,
  ToolbarGroup,
  ToolbarFilter,
  Menu,
  MenuContent,
  MenuList,
  MenuItem,
  MenuToggle,
  MenuContainer,
} from '@patternfly/react-core';
import { FilterIcon } from '@patternfly/react-icons/dist/esm/icons/filter-icon';
import { ApplicationFilter } from './ApplicationFilter';
import { SearchFilter } from './SearchFilter';
import { StatusFilter } from './StatusFilter';
import { TenantFilter } from './TenantFilter';

interface ReleaseFiltersProps {
  applications: string[];
  tenants: string[];
  applicationSelections: string[];
  tenantSelections: string[];
  statusSelection: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
  onApplicationSelectionsChange: (selections: string[]) => void;
  onTenantSelect: (itemId: string | number | undefined) => void;
  onStatusSelect: (itemId: string | number | undefined) => void;
  onClearFilters: () => void;
}

type AttributeMenuType = 'Application' | 'Namespace' | 'Release Plan' | 'Status';

export const ReleaseFilters: React.FC<ReleaseFiltersProps> = ({
  applications,
  tenants,
  applicationSelections,
  tenantSelections,
  statusSelection,
  searchValue,
  onSearchChange,
  onApplicationSelectionsChange,
  onTenantSelect,
  onStatusSelect,
  onClearFilters,
}) => {
  const [activeAttributeMenu, setActiveAttributeMenu] =
    React.useState<AttributeMenuType>('Application');
  const [isAttributeMenuOpen, setIsAttributeMenuOpen] = React.useState(false);
  const attributeToggleRef = React.useRef<HTMLButtonElement>(null);
  const attributeMenuRef = React.useRef<HTMLDivElement>(null);
  const attributeContainerRef = React.useRef<HTMLDivElement>(null);

  const onAttributeToggleClick = (ev: React.MouseEvent) => {
    ev.stopPropagation();
    setTimeout(() => {
      if (attributeMenuRef.current) {
        const firstElement = attributeMenuRef.current.querySelector('li > button:not(:disabled)');
        firstElement && (firstElement as HTMLElement).focus();
      }
    }, 0);
    setIsAttributeMenuOpen(!isAttributeMenuOpen);
  };

  const attributeToggle = (
    <MenuToggle
      ref={attributeToggleRef}
      onClick={onAttributeToggleClick}
      isExpanded={isAttributeMenuOpen}
      icon={<FilterIcon />}
    >
      {activeAttributeMenu}
    </MenuToggle>
  );

  const attributeMenu = (
    <Menu
      ref={attributeMenuRef}
      onSelect={(_ev, itemId) => {
        setActiveAttributeMenu(itemId?.toString() as AttributeMenuType);
        setIsAttributeMenuOpen(!isAttributeMenuOpen);
      }}
    >
      <MenuContent>
        <MenuList>
          <MenuItem itemId="Application">Application</MenuItem>
          <MenuItem itemId="Namespace">Namespace</MenuItem>
          <MenuItem itemId="Release Plan">Release Plan</MenuItem>
          <MenuItem itemId="Status">Status</MenuItem>
        </MenuList>
      </MenuContent>
    </Menu>
  );

  const attributeDropdown = (
    <MenuContainer
      isOpen={isAttributeMenuOpen}
      onOpenChange={(open) => setIsAttributeMenuOpen(open)}
      toggle={attributeToggle}
      menu={attributeMenu}
      toggleRef={attributeToggleRef}
      menuRef={attributeContainerRef}
    />
  );

  const renderActiveFilter = () => {
    switch (activeAttributeMenu) {
      case 'Application':
        return (
          <ToolbarFilter
            chips={applicationSelections}
            deleteChip={(_, chip) =>
              onApplicationSelectionsChange(applicationSelections.filter((s) => s !== chip))
            }
            deleteChipGroup={() => onApplicationSelectionsChange([])}
            categoryName="application"
          >
            <ApplicationFilter
              applications={applications}
              onSelectionsChange={onApplicationSelectionsChange}
            />
          </ToolbarFilter>
        );
      case 'Namespace':
        return (
          <ToolbarFilter
            chips={tenantSelections}
            deleteChip={() => onTenantSelect(undefined)}
            deleteChipGroup={() => onTenantSelect(undefined)}
            categoryName="tenant"
          >
            <TenantFilter
              tenants={tenants}
              selections={tenantSelections}
              onSelect={onTenantSelect}
            />
          </ToolbarFilter>
        );
      case 'Release Plan':
        return (
          <ToolbarFilter
            chips={searchValue !== '' ? [searchValue] : []}
            deleteChip={() => onSearchChange('')}
            deleteChipGroup={() => onSearchChange('')}
            categoryName="releaseplan"
          >
            <SearchFilter value={searchValue} onChange={onSearchChange} />
          </ToolbarFilter>
        );
      case 'Status':
        return (
          <ToolbarFilter
            chips={statusSelection !== '' ? [statusSelection] : []}
            deleteChip={() => onStatusSelect(undefined)}
            deleteChipGroup={() => onStatusSelect(undefined)}
            categoryName="status"
          >
            <StatusFilter selection={statusSelection} onSelect={onStatusSelect} />
          </ToolbarFilter>
        );
      default:
        return null;
    }
  };

  return (
    <Toolbar id="attribute-search-filter-toolbar" clearAllFilters={onClearFilters}>
      <ToolbarContent>
        <ToolbarToggleGroup toggleIcon={<FilterIcon />} breakpoint="xl">
          <ToolbarGroup variant="filter-group">
            <ToolbarItem>{attributeDropdown}</ToolbarItem>
            {renderActiveFilter()}
          </ToolbarGroup>
        </ToolbarToggleGroup>
      </ToolbarContent>
    </Toolbar>
  );
};
