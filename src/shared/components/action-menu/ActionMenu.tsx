import * as React from 'react';
import { Menu, Popper, MenuContent, MenuList } from '@patternfly/react-core';
import ActionMenuContent from './ActionMenuContent';
import ActionMenuToggle from './ActionMenuToggle';
import { ActionMenuVariant, MenuOption } from './types';

import './ActionMenu.scss';

type ActionMenuProps = {
  actions: MenuOption[];
  variant?: ActionMenuVariant;
  label?: string;
  isDisabled?: boolean;
  onOpen?: (isOpen: boolean) => void;
};

type MenuRendererProps = {
  isOpen: boolean;
  containerRef: React.RefObject<HTMLDivElement>;
  menuRef: React.RefObject<HTMLDivElement>;
  toggleRef: React.RefObject<HTMLButtonElement>;
} & React.ComponentProps<typeof ActionMenuContent>;

const MenuRenderer: React.FC<React.PropsWithChildren<MenuRendererProps>> = ({
  isOpen,
  containerRef,
  menuRef,
  toggleRef,
  ...restProps
}) => {
  const menu = (
    <Menu ref={menuRef} containsFlyout onSelect={restProps.onClick}>
      <MenuContent data-test="action-menu" translate="no">
        <MenuList>
          <ActionMenuContent {...restProps} />
        </MenuList>
      </MenuContent>
    </Menu>
  );

  return (
    <Popper
      triggerRef={toggleRef}
      popper={menu}
      placement="bottom-end"
      isVisible={isOpen}
      appendTo={containerRef.current}
    />
  );
};

const ActionMenu: React.FC<React.PropsWithChildren<ActionMenuProps>> = ({
  variant = ActionMenuVariant.KEBAB,
  label,
  isDisabled,
  actions,
  onOpen,
}) => {
  const [isOpen, setIsOpen] = React.useState<boolean>(false);
  const menuRef = React.useRef<HTMLDivElement>(null);
  const toggleRef = React.useRef<HTMLButtonElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const hideMenu = () => {
    setIsOpen(false);
  };

  const handleToggle = (setOpen: React.SetStateAction<boolean>) => {
    const newOpen = typeof setOpen === 'function' ? setOpen(isOpen) : setOpen;
    if (onOpen) {
      onOpen(newOpen);
    }
    setIsOpen(newOpen);
  };

  return (
    <div className="action-menu-container" ref={containerRef}>
      <ActionMenuToggle
        isOpen={isOpen}
        isDisabled={isDisabled}
        toggleRef={toggleRef}
        toggleVariant={variant}
        toggleTitle={label}
        menuRef={menuRef}
        onToggleClick={handleToggle}
      />
      <MenuRenderer
        isOpen={isOpen}
        options={actions}
        containerRef={containerRef}
        menuRef={menuRef}
        toggleRef={toggleRef}
        onClick={hideMenu}
        focusItem={actions[0]}
      />
    </div>
  );
};

export default React.memo(ActionMenu);
