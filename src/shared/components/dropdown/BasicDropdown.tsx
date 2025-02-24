import React from 'react';
import { Badge, ValidatedOptions } from '@patternfly/react-core';
import {
  Dropdown,
  DropdownToggle,
  DropdownItem,
  DropdownItemProps,
  DropdownSeparator,
} from '@patternfly/react-core/deprecated';
import './BasicDropdown.scss';

export type DropdownItemObject = {
  key: string;
  value: string;
  separator?: boolean;
} & DropdownItemProps;

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
  dropdownToggle,
  validated,
}) => {
  const [dropdownOpen, setDropdownOpen] = React.useState<boolean>(false);
  const onToggle = (
    _:
      | MouseEvent
      | TouchEvent
      | KeyboardEvent
      | React.KeyboardEvent<unknown>
      | React.MouseEvent<HTMLButtonElement>,
    isOpen: boolean,
  ) => setDropdownOpen(isOpen);
  // We enjoys the DropDown from the following file
  // node_modules/@patternfly/react-core/src/deprecated/components/Dropdown/Dropdown.tsx
  // The onSelect of it just supports event.
  // If we enjoy (event: React.SyntheticEvent, value: string), we would
  // meet error: Type '(event: React.SyntheticEvent, value: string) => void'
  // is not assignable to type '(event?: SyntheticEvent<HTMLDivElement, Event>) => void'.
  const onSelect = (event: React.SyntheticEvent<HTMLDivElement>) => {
    // When the dropdown has the description, the currentTarget.textContent
    // would contain main + description. And we just need the main value.
    const targetClassName = 'pf-v5-c-dropdown__menu-item-main';
    const targetText =
      event.currentTarget.querySelector(`.${targetClassName}`)?.textContent ||
      event.currentTarget.textContent;

    onChange && onChange(targetText);
    setDropdownOpen(false);
  };

  const recommendedBadge = React.useMemo(
    () => (
      <>
        &nbsp;<Badge isRead>Recommended</Badge>
      </>
    ),
    [],
  );

  const dropdownToggleComponent = React.useMemo(
    () =>
      dropdownToggle ? (
        dropdownToggle(onToggle)
      ) : (
        <DropdownToggle onToggle={onToggle} isDisabled={disabled} data-test="dropdown-toggle">
          {selected ? (
            <>
              {selected}
              {selected === recommended && recommendedBadge}
            </>
          ) : (
            placeholder
          )}
        </DropdownToggle>
      ),
    [dropdownToggle, disabled, selected, recommended, recommendedBadge, placeholder],
  );

  const dropdownItems = React.useMemo(
    () =>
      items.map((item) => {
        const { key, value, separator, ...props } = item;
        if (separator) {
          return <DropdownSeparator key={key} />;
        }
        return (
          <DropdownItem key={key} {...props}>
            {value}
            {value === recommended && recommendedBadge}
          </DropdownItem>
        );
      }),
    [items, recommended, recommendedBadge],
  );
  return (
    <Dropdown
      onSelect={onSelect}
      toggle={dropdownToggleComponent}
      isOpen={dropdownOpen}
      dropdownItems={dropdownItems}
      autoFocus={false}
      disabled={disabled}
      className="basic-dropdown"
      data-test="dropdown"
      {...(validated === ValidatedOptions.error && { 'aria-invalid': true })}
    />
  );
};

export default BasicDropdown;
