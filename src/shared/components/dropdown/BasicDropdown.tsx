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
  TextInputGroup,
  TextInputGroupMain,
  TextInputGroupUtilities,
  Button,
} from '@patternfly/react-core';
import './BasicDropdown.scss';
import { TimesIcon } from '@patternfly/react-icons/dist/esm/icons/times-icon';
import { NO_RESULTS } from '~/consts/constants';

export type DropdownItemObject = {
  key: string;
  value: string;
  description?: string;
  separator?: boolean;
  isDisabled?: boolean;
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
  variant?: 'default' | 'typeahead';
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
  variant,
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [currItems, setCurrItems] = React.useState(items);
  const [filterValue, setFilterValue] = React.useState('');
  const textInputRef = React.useRef<HTMLInputElement>();

  React.useEffect(() => {
    let newItems = items;

    if (filterValue) {
      newItems = items.filter((item) =>
        item.value.toLowerCase().includes(filterValue.toLowerCase()),
      );

      // When no options are found after filtering, display 'No results found'
      if (!newItems.length) {
        newItems = [
          {
            isDisabled: true,
            value: `No results found for "${filterValue}"`,
            key: NO_RESULTS,
          },
        ];
      }

      if (!isOpen) {
        setIsOpen(true);
      }
    }

    setCurrItems(newItems);
  }, [filterValue, isOpen, items]);

  const handleSelect = (_ev: unknown, value: string | number) => {
    if (typeof value === 'string' && value !== NO_RESULTS) {
      setFilterValue('');
      onChange?.(value);
      setIsOpen(false);
    }
  };

  const onClearButtonClick = () => {
    setFilterValue('');
    onChange('');
  };

  const onToggleClick = async () => {
    if (!disabled) {
      const newOpen = !isOpen;
      setIsOpen(newOpen);

      if (variant === 'typeahead') {
        if (newOpen) {
          // Necessary for the text input to be correctly focused
          await new Promise((resolve) => setTimeout(resolve, 100));
          textInputRef?.current?.focus();
        }
      }
    }
  };

  const onTextInputChange = (_event: React.FormEvent<HTMLInputElement>, value: string) => {
    setFilterValue(value);

    if (value !== selected) {
      onChange('');
    }
  };

  const typeaheadMenu = (
    <TextInputGroup isPlain>
      <TextInputGroupMain
        value={selected ? selected : filterValue}
        onClick={onToggleClick}
        onChange={onTextInputChange}
        id="basic-dropdown-typeahead-input"
        autoComplete="off"
        innerRef={textInputRef}
        placeholder={placeholder}
        role="combobox"
        isExpanded={isOpen}
        aria-controls="basic-dropdown-listbox"
      />
      <TextInputGroupUtilities
        {...(!(selected || filterValue) ? { style: { display: 'none' } } : {})}
      >
        <Button variant="plain" onClick={onClearButtonClick} aria-label="Clear input value">
          <TimesIcon aria-hidden />
        </Button>
      </TextInputGroupUtilities>
    </TextInputGroup>
  );

  const defaultMenu = selected ? (
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
  );

  const menuToggle = (toggleRef) => {
    return (
      <MenuToggle
        aria-disabled={disabled}
        data-test="dropdown-toggle"
        style={{ width: fullWidth ? '100%' : undefined }}
        ref={toggleRef}
        isExpanded={isOpen}
        isDisabled={disabled}
        onClick={() => onToggleClick()}
        variant={variant}
        aria-invalid={validated === ValidatedOptions.error}
      >
        {variant === 'default' ? defaultMenu : typeaheadMenu}
      </MenuToggle>
    );
  };

  return (
    <>
      <Select
        id="basic-dropdown"
        isOpen={isOpen}
        onOpenChange={(newIsOpen) => {
          if (!disabled) setIsOpen(newIsOpen);
        }}
        selected={selected}
        onSelect={handleSelect}
        aria-invalid={validated === ValidatedOptions.error}
        maxMenuHeight="40vh"
        style={{ overflowY: 'auto' }}
        toggle={menuToggle}
      >
        <SelectList id="basic-dropdown-listbox">
          {currItems.map(({ key, value, description, separator, isDisabled }) =>
            separator ? (
              <Divider key={key} component="li" />
            ) : (
              <SelectOption
                key={key}
                value={value}
                role="menuitem"
                ref={null}
                isDisabled={isDisabled}
              >
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
    </>
  );
};

export default BasicDropdown;
