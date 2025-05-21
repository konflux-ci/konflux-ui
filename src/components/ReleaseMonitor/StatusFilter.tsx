import * as React from 'react';
import {
  Menu,
  MenuContent,
  MenuList,
  MenuItem,
  MenuToggle,
  MenuContainer,
} from '@patternfly/react-core';
import { FilterIcon } from '@patternfly/react-icons/dist/esm/icons/filter-icon';

interface StatusFilterProps {
  selection: string;
  onSelect: (itemId: string | number | undefined) => void;
}

export const StatusFilter: React.FC<StatusFilterProps> = ({ selection, onSelect }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const toggleRef = React.useRef<HTMLButtonElement>(null);
  const menuRef = React.useRef<HTMLDivElement>(null);

  const onToggleClick = (ev: React.MouseEvent) => {
    ev.stopPropagation();
    setIsOpen(!isOpen);
  };

  const toggle = (
    <MenuToggle ref={toggleRef} onClick={onToggleClick} isExpanded={isOpen} icon={<FilterIcon />}>
      Filter by status
    </MenuToggle>
  );

  const menu = (
    <Menu ref={menuRef} onSelect={(_, itemId) => onSelect(itemId)}>
      <MenuContent>
        <MenuList>
          <MenuItem key="Succeeded" itemId="Succeeded" isSelected={selection === 'Succeeded'}>
            Succeeded
          </MenuItem>
          <MenuItem key="Failed" itemId="Failed" isSelected={selection === 'Failed'}>
            Failed
          </MenuItem>
          <MenuItem key="Progressing" itemId="Progressing" isSelected={selection === 'Progressing'}>
            Progressing
          </MenuItem>
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
