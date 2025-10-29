import React from 'react';
import { Menu, MenuContent, MenuList, MenuItem, MenuToggle, Popper } from '@patternfly/react-core';
import { FilterIcon } from '@patternfly/react-icons/dist/esm/icons/filter-icon';
import { AttributeOption } from './pipelineruns-filter-utils';

interface AttributeSelectorProps {
  options: AttributeOption[];
  activeAttribute: string;
  onAttributeChange: (attribute: string) => void;
  isDisabled?: boolean;
}

export const AttributeSelector: React.FC<AttributeSelectorProps> = ({
  options,
  activeAttribute,
  onAttributeChange,
  isDisabled = false,
}) => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  // Refs for dropdown
  const toggleRef = React.useRef<HTMLButtonElement>(null);
  const menuRef = React.useRef<HTMLDivElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Event handlers
  const handleMenuKeys = React.useCallback(
    (event: KeyboardEvent) => {
      if (!isMenuOpen) return;

      if (
        menuRef.current?.contains(event.target as Node) ||
        toggleRef.current?.contains(event.target as Node)
      ) {
        if (event.key === 'Escape' || event.key === 'Tab') {
          setIsMenuOpen(false);
          toggleRef.current?.focus();
        }
      }
    },
    [isMenuOpen],
  );

  const handleClickOutside = React.useCallback(
    (event: MouseEvent) => {
      if (isMenuOpen && !menuRef.current?.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    },
    [isMenuOpen],
  );

  React.useEffect(() => {
    window.addEventListener('keydown', handleMenuKeys);
    window.addEventListener('click', handleClickOutside);
    return () => {
      window.removeEventListener('keydown', handleMenuKeys);
      window.removeEventListener('click', handleClickOutside);
    };
  }, [handleMenuKeys, handleClickOutside]);

  const onToggleClick = (ev: React.MouseEvent) => {
    ev.stopPropagation();
    if (!isDisabled) {
      setTimeout(() => {
        if (menuRef.current) {
          const firstElement = menuRef.current.querySelector('li > button:not(:disabled)');
          firstElement && (firstElement as HTMLElement).focus();
        }
      }, 0);
      setIsMenuOpen(!isMenuOpen);
    }
  };

  const onSelect = (_ev: React.MouseEvent, itemId: string | number | undefined) => {
    if (itemId) {
      onAttributeChange(itemId.toString());
      setIsMenuOpen(false);
    }
  };

  // Find the current attribute label
  const currentLabel =
    options.find((option) => option.key === activeAttribute)?.label || activeAttribute;

  const toggle = (
    <MenuToggle
      ref={toggleRef}
      onClick={onToggleClick}
      isExpanded={isMenuOpen}
      isDisabled={isDisabled}
      icon={<FilterIcon />}
    >
      {currentLabel}
    </MenuToggle>
  );

  const menu = (
    <Menu ref={menuRef} onSelect={onSelect} selected={activeAttribute}>
      <MenuContent>
        <MenuList>
          {options.map((option) => (
            <MenuItem key={option.key} itemId={option.key}>
              {option.label}
            </MenuItem>
          ))}
        </MenuList>
      </MenuContent>
    </Menu>
  );

  return (
    <div ref={containerRef}>
      <Popper
        trigger={toggle}
        triggerRef={toggleRef}
        popper={menu}
        popperRef={menuRef}
        appendTo={containerRef.current || undefined}
        isVisible={isMenuOpen}
      />
    </div>
  );
};
