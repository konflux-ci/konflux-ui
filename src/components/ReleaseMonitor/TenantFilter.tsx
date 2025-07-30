import * as React from 'react';
import {
  Menu,
  MenuContent,
  MenuList,
  MenuItem,
  MenuToggle,
  Badge,
  MenuContainer,
} from '@patternfly/react-core';
import { FilterIcon } from '@patternfly/react-icons/dist/esm/icons/filter-icon';

interface TenantFilterProps {
  tenants: string[];
  selections: string[];
  onSelect: (itemId: string | number | undefined) => void;
}

export const TenantFilter: React.FC<TenantFilterProps> = ({ tenants, selections, onSelect }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const toggleRef = React.useRef<HTMLButtonElement>(null);
  const menuRef = React.useRef<HTMLDivElement>(null);

  const onToggleClick = (ev: React.MouseEvent) => {
    ev.stopPropagation();
    setIsOpen(!isOpen);
  };

  const toggle = (
    <MenuToggle
      ref={toggleRef}
      onClick={onToggleClick}
      isExpanded={isOpen}
      icon={<FilterIcon />}
      badge={selections.length > 0 ? <Badge isRead>{selections.length}</Badge> : undefined}
    >
      Filter by namespace
    </MenuToggle>
  );

  const menu = (
    <Menu ref={menuRef} onSelect={(_, itemId) => onSelect(itemId)}>
      <MenuContent>
        <MenuList>
          {tenants.map((tenant) => (
            <MenuItem key={tenant} itemId={tenant} isSelected={selections.includes(tenant)}>
              {tenant}
            </MenuItem>
          ))}
        </MenuList>
      </MenuContent>
    </Menu>
  );

  return (
    <MenuContainer
      isOpen={isOpen}
      onOpenChange={(open) => setIsOpen(open)}
      toggle={toggle}
      menu={menu}
      toggleRef={toggleRef}
      menuRef={menuRef}
    />
  );
};
