import * as React from 'react';
import { Badge, Menu, MenuContainer, MenuContent, MenuToggle } from '@patternfly/react-core';

type SelectComponentsDropdownProps = {
  children: React.ReactNode;
  toggleText: string;
  onSelect: (item: string | number) => void;
  closeOnSelect?: boolean;
  badgeValue?: number;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
};

const SelectComponentsDropdown: React.FC<SelectComponentsDropdownProps> = ({
  children,
  toggleText,
  onSelect,
  closeOnSelect,
  badgeValue,
  isOpen: isOpenProp,
  onOpenChange,
}) => {
  const [internalIsOpen, setInternalIsOpen] = React.useState(false);
  const isControlled = isOpenProp !== undefined;
  const isOpen = isControlled ? isOpenProp : internalIsOpen;
  const setIsOpen = React.useCallback(
    (open: boolean) => {
      if (!isControlled) {
        setInternalIsOpen(open);
      }
      onOpenChange?.(open);
    },
    [isControlled, onOpenChange],
  );
  const toggleRef = React.useRef<HTMLButtonElement>(null);
  const menuRef = React.useRef<HTMLDivElement>(null);

  return (
    <>
      <MenuContainer
        isOpen={isOpen}
        onOpenChange={setIsOpen}
        toggle={
          <MenuToggle
            ref={toggleRef}
            isExpanded={isOpen}
            onClick={() => setIsOpen(!isOpen)}
            id="toggle-component-menu"
            aria-label="toggle component menu"
            badge={badgeValue ? <Badge isRead>{badgeValue}</Badge> : null}
            style={{ width: '100%' }}
          >
            {toggleText}
          </MenuToggle>
        }
        menu={
          <Menu
            title="Components"
            ref={menuRef}
            id="component-menu"
            isScrollable
            style={{ width: '90%' }}
            onSelect={(_, itemId) => {
              onSelect(itemId as string);
              if (closeOnSelect) {
                setIsOpen(false);
              }
            }}
          >
            <MenuContent>{children}</MenuContent>
          </Menu>
        }
        toggleRef={toggleRef}
        menuRef={menuRef}
      />
    </>
  );
};

export default SelectComponentsDropdown;
