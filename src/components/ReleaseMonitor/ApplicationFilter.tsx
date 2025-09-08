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

interface ApplicationFilterProps {
  applications: string[];
  onSelectionsChange: (selections: string[]) => void;
}

export const ApplicationFilter: React.FC<ApplicationFilterProps> = ({
  applications,
  onSelectionsChange,
}) => {
  const [selections, setSelections] = React.useState<string[]>([]);
  const [isOpen, setIsOpen] = React.useState(false);
  const toggleRef = React.useRef<HTMLButtonElement>(null);
  const menuRef = React.useRef<HTMLDivElement>(null);

  const onToggleClick = (ev: React.MouseEvent) => {
    ev.stopPropagation();
    setIsOpen(!isOpen);
  };

  const onSelect = (itemId: string | number | undefined) => {
    if (itemId === undefined) {
      setSelections([]);
      onSelectionsChange([]);
      return;
    }
    const itemStr = itemId.toString();
    const newSelections = selections.includes(itemStr)
      ? selections.filter((selection) => selection !== itemStr)
      : [itemStr, ...selections];
    setSelections(newSelections);
    onSelectionsChange(newSelections);
  };

  const toggle = (
    <MenuToggle
      ref={toggleRef}
      onClick={onToggleClick}
      isExpanded={isOpen}
      icon={<FilterIcon />}
      badge={selections.length > 0 ? <Badge isRead>{selections.length}</Badge> : undefined}
    >
      Filter by application
    </MenuToggle>
  );

  const menu = (
    <Menu ref={menuRef} onSelect={(_, itemId) => onSelect(itemId)}>
      <MenuContent>
        <MenuList>
          {applications.map((application) => (
            <MenuItem
              key={application}
              itemId={application}
              isSelected={selections.includes(application)}
            >
              {application}
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
