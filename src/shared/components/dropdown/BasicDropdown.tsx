import React from 'react';
import {
  Select,
  SelectList,
  SelectOption,
  Badge,
  HelperText,
  HelperTextItem,
  Divider,
  ValidatedOptions,
  MenuToggle,
} from '@patternfly/react-core';

import './BasicDropdown.scss';

export type DropdownItemObject = {
  key: string;
  value: string;
  description?: string;
  separator?: boolean;
};

type BasicDropdownProps = {
  items: DropdownItemObject[];
  selected?: string;
  recommended?: string;
  onChange?: (selection: string) => void;
  placeholder?: string;
  fullWidth?: boolean;
  disabled?: boolean;
  validated?: ValidatedOptions;
  helperText?: string;
};

const BasicDropdown: React.FC<BasicDropdownProps> = ({
  items,
  selected,
  recommended,
  onChange,
  placeholder,
  fullWidth = true,
  disabled,
  validated,
  helperText,
}) => {
  const [isOpen, setIsOpen] = React.useState(false);

  const handleSelect = (_ev: unknown, value: string | number) => {
    if (typeof value === 'string') {
      onChange?.(value);
      setIsOpen(false);
    }
  };

  return (
    <div>
      <Select
        isOpen={isOpen}
        onOpenChange={(newIsOpen) => {
          if (!disabled) setIsOpen(newIsOpen);
        }}
        selected={selected}
        onSelect={handleSelect}
        aria-invalid={validated === ValidatedOptions.error}
        toggle={(toggleRef) => (
          <MenuToggle
            aria-disabled={disabled}
            data-test="dropdown-toggle"
            style={{ width: fullWidth ? '100%' : undefined }}
            ref={toggleRef}
            isExpanded={isOpen}
            isDisabled={disabled}
            onClick={() => !disabled && setIsOpen(!isOpen)}
            variant="default"
            aria-invalid={validated === ValidatedOptions.error}
          >
            {selected ? (
              <>
                {selected}
                {selected === recommended && (
                  <>
                    &nbsp;<Badge isRead>Recommended</Badge>
                  </>
                )}
              </>
            ) : (
              <span>{placeholder ?? ''}</span>
            )}
          </MenuToggle>
        )}
      >
        <SelectList>
          {items.map(({ key, value, description, separator }) =>
            separator ? (
              <Divider key={key} component="li" />
            ) : (
              <SelectOption key={key} value={value} role="menuitem">
                <div>
                  {value}
                  {value === recommended && (
                    <>
                      &nbsp;<Badge isRead>Recommended</Badge>
                    </>
                  )}
                </div>
                {description && <div className="dropdown-item-description">{description}</div>}
              </SelectOption>
            ),
          )}
        </SelectList>
      </Select>

      {validated === ValidatedOptions.error && helperText && (
        <HelperText>
          <HelperTextItem variant="error">{helperText}</HelperTextItem>
        </HelperText>
      )}
    </div>
  );
};

export default BasicDropdown;
