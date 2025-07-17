import React, { useState } from 'react';
import {
  Dropdown,
  DropdownItem,
  DropdownList,
  Flex,
  MenuToggle,
  MenuToggleElement,
} from '@patternfly/react-core';
import { CogIcon } from '@patternfly/react-icons/dist/esm/icons/cog-icon';
import { MoonIcon } from '@patternfly/react-icons/dist/esm/icons/moon-icon';
import { SunIcon } from '@patternfly/react-icons/dist/esm/icons/sun-icon';
import { THEME_SYSTEM, THEME_DARK, THEME_LIGHT, THEME_LABELS } from './const';
import { useTheme, ThemePreference } from './useTheme';

interface ThemeDropdownProps {
  /** Custom class for the dropdown toggle */
  className?: string;
  /** Whether to show text alongside the icon */
  showText?: boolean;
}

const getThemeIcon = (theme: ThemePreference, effectiveTheme: 'dark' | 'light') => {
  switch (theme) {
    case THEME_DARK:
      return <MoonIcon />;
    case THEME_LIGHT:
      return <SunIcon />;
    case THEME_SYSTEM:
      return effectiveTheme === THEME_DARK ? <MoonIcon /> : <SunIcon />;
    default:
      return <CogIcon />;
  }
};

export const ThemeDropdown: React.FC<ThemeDropdownProps> = ({ className, showText = false }) => {
  const { preference, effectiveTheme, setThemePreference } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const onToggleClick = () => {
    setIsOpen(!isOpen);
  };

  const onSelect = (
    _event: React.MouseEvent<Element, MouseEvent> | undefined,
    value: string | number | undefined,
  ) => {
    if (value && typeof value === 'string') {
      setThemePreference(value as ThemePreference);
    }
    setIsOpen(false);
  };

  const toggle = (toggleRef: React.Ref<MenuToggleElement>) => (
    <MenuToggle
      variant="plain"
      ref={toggleRef}
      onClick={onToggleClick}
      isExpanded={isOpen}
      className={className}
      aria-label="Theme selection"
      data-test="theme-dropdown-toggle"
    >
      <Flex gap={{ default: 'gapSm' }} alignItems={{ default: 'alignItemsCenter' }}>
        {getThemeIcon(preference, effectiveTheme)}
        {showText && THEME_LABELS[preference]}
      </Flex>
    </MenuToggle>
  );

  return (
    <Dropdown
      isOpen={isOpen}
      onSelect={onSelect}
      onOpenChange={(isDropdownOpen: boolean) => setIsOpen(isDropdownOpen)}
      toggle={toggle}
      data-test="theme-dropdown"
    >
      <DropdownList>
        <DropdownItem
          value={THEME_SYSTEM}
          isSelected={preference === THEME_SYSTEM}
          data-test="theme-system"
          icon={<CogIcon />}
        >
          {THEME_LABELS[THEME_SYSTEM]}
        </DropdownItem>
        <DropdownItem
          value={THEME_LIGHT}
          isSelected={preference === THEME_LIGHT}
          data-test="theme-light"
          icon={<SunIcon />}
        >
          {THEME_LABELS[THEME_LIGHT]}
        </DropdownItem>
        <DropdownItem
          value={THEME_DARK}
          isSelected={preference === THEME_DARK}
          data-test="theme-dark"
          icon={<MoonIcon />}
        >
          {THEME_LABELS[THEME_DARK]}
        </DropdownItem>
      </DropdownList>
    </Dropdown>
  );
};
