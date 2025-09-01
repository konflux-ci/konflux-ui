import React from 'react';
import {
  Menu,
  MenuContainer,
  MenuContent,
  MenuItem,
  MenuList,
  MenuToggle,
} from '@patternfly/react-core';
import { AttributeOption } from '../generic/FilterConfig';

interface AttributeSelectorProps {
  options: AttributeOption[];
  activeAttribute: string;
  onAttributeChange: (attribute: string) => void;
}

export const AttributeSelector: React.FC<AttributeSelectorProps> = ({
  options,
  activeAttribute,
  onAttributeChange,
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const toggleRef = React.useRef<HTMLButtonElement>(null);
  const menuRef = React.useRef<HTMLDivElement>(null);

  // Find the active option to display its label
  const activeOption = options.find((option) => option.key === activeAttribute);
  const displayText = activeOption?.label || activeAttribute;

  const handleSelect = (
    _event: React.MouseEvent | undefined,
    itemId: string | number | undefined,
  ) => {
    if (typeof itemId === 'string') {
      onAttributeChange(itemId);
      setIsOpen(false);
    }
  };

  return (
    <MenuContainer
      isOpen={isOpen}
      onOpenChange={(open) => setIsOpen(open)}
      toggle={
        <MenuToggle
          ref={toggleRef}
          isExpanded={isOpen}
          onClick={() => setIsOpen(!isOpen)}
          id="attribute-selector-toggle"
          aria-label="Select search attribute"
        >
          {displayText}
        </MenuToggle>
      }
      menu={
        <Menu
          ref={menuRef}
          id="attribute-selector-menu"
          selected={activeAttribute}
          onSelect={handleSelect}
        >
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
      }
      toggleRef={toggleRef}
      menuRef={menuRef}
    />
  );
};
