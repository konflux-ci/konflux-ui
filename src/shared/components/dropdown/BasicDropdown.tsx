import React, { useCallback } from 'react';
import {
  Badge,
  Dropdown,
  DropdownItem,
  DropdownToggleProps,
  ValidatedOptions,
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
  dropdownToggle?: (
    onToggle: (
      ev:
        | MouseEvent
        | TouchEvent
        | KeyboardEvent
        | React.KeyboardEvent<unknown>
        | React.MouseEvent<HTMLButtonElement>,
      isOpen: boolean,
    ) => void,
  ) => React.ReactElement;
  validated?: ValidatedOptions;
};

const BasicDropdown: React.FC<React.PropsWithChildren<BasicDropdownProps>> = ({
  items,
  selected,
  recommended,
  onChange,
  placeholder,
  disabled,
  validated,
}) => {
  const [dropdownOpen, setDropdownOpen] = React.useState<boolean>(false);

  const onSelect = useCallback(
    (value: string) => {
      onChange && onChange(value);
      setDropdownOpen(false);
    },
    [onChange],
  );

  const recommendedBadge = React.useMemo(
    () => (
      <>
        &nbsp;<Badge isRead>Recommended</Badge>
      </>
    ),
    [],
  );

  const dropdownToggleComponent: DropdownToggleProps = React.useMemo(
    () => ({
      toggleNode: (
        <div
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="dropdown-toggle"
          aria-disabled={disabled}
          data-test="dropdown-toggle"
        >
          {selected ? (
            <>
              {selected}
              {selected === recommended && recommendedBadge}
            </>
          ) : (
            placeholder
          )}
        </div>
      ),
    }),
    [disabled, selected, recommended, recommendedBadge, placeholder, dropdownOpen],
  );

  const dropdownItems = React.useMemo(
    () =>
      items.map((item) => {
        const { key, value, description, separator } = item;
        if (separator) {
          return (
            <DropdownItem key={key} component="div">
              <hr />
            </DropdownItem>
          );
        }
        return (
          <DropdownItem
            key={key}
            onClick={() => onSelect(value)}
            component="div"
            data-test={`dropdown-item-${key}`}
          >
            <div>{value}</div>
            {description && <div className="dropdown-item-description">{description}</div>}
            {value === recommended && recommendedBadge}
          </DropdownItem>
        );
      }),
    [items, onSelect, recommended, recommendedBadge],
  );

  return (
    <Dropdown
      toggle={dropdownToggleComponent}
      isOpen={dropdownOpen}
      onSelect={(_event, value) => onSelect(value as string)}
      className="basic-dropdown"
      data-test="dropdown"
      {...(validated === ValidatedOptions.error && { 'aria-invalid': true })}
    >
      {dropdownItems}
    </Dropdown>
  );
};

export default BasicDropdown;
