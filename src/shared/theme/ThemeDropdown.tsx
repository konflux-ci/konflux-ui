import React, { useState } from 'react';
import {
  Divider,
  Dropdown,
  DropdownGroup,
  DropdownItem,
  DropdownList,
  Flex,
  FlexItem,
  MenuToggle,
  MenuToggleElement,
} from '@patternfly/react-core';
import { AdjustIcon } from '@patternfly/react-icons/dist/esm/icons/adjust-icon';
import { CogIcon } from '@patternfly/react-icons/dist/esm/icons/cog-icon';
import { EyeIcon } from '@patternfly/react-icons/dist/esm/icons/eye-icon';
import { MoonIcon } from '@patternfly/react-icons/dist/esm/icons/moon-icon';
import { SunIcon } from '@patternfly/react-icons/dist/esm/icons/sun-icon';
import {
  THEME_SYSTEM,
  THEME_DARK,
  THEME_LIGHT,
  CONTRAST_SYSTEM,
  CONTRAST_DEFAULT,
  CONTRAST_HIGH,
  THEME_PREFERENCE_LABELS,
  CONTRAST_PREFERENCE_LABELS,
} from './const';
import { ContrastMode, ContrastPreference, Theme, ThemePreference } from './types';
import { useTheme } from './useTheme';

interface ThemeDropdownProps {
  /** Custom class for the dropdown toggle */
  className?: string;
  /** Whether to show text alongside the icon */
  showText?: boolean;
}

const getColorSchemeIcon = (preference: ThemePreference, effectiveTheme: Theme) => {
  switch (preference) {
    case THEME_DARK:
      return <MoonIcon />;
    case THEME_LIGHT:
      return <SunIcon />;
    case THEME_SYSTEM:
      return effectiveTheme === THEME_DARK ? <MoonIcon /> : <SunIcon />;
    default:
      return <SunIcon />;
  }
};

const getContrastIcon = (preference: ContrastPreference, effectiveContrast: ContrastMode) => {
  switch (preference) {
    case CONTRAST_HIGH:
      return <AdjustIcon />;
    case CONTRAST_DEFAULT:
      return <EyeIcon />;
    case CONTRAST_SYSTEM:
      return effectiveContrast === CONTRAST_HIGH ? <AdjustIcon /> : <EyeIcon />;
    default:
      return <EyeIcon />;
  }
};

export const ThemeDropdown: React.FC<ThemeDropdownProps> = ({ className, showText = false }) => {
  const {
    preference,
    contrastPreference,
    effectiveTheme,
    effectiveContrast,
    setThemePreference,
    setContrastPreference,
  } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const onToggleClick = () => {
    setIsOpen(!isOpen);
  };

  const onSelect = (
    _event: React.MouseEvent<Element, MouseEvent> | undefined,
    value: string | number | undefined,
  ) => {
    if (!value || typeof value !== 'string') {
      return;
    }

    // Values are prefixed to distinguish groups
    if (value === 'brand-theme') {
      return; // Handled by the Switch onChange directly
    } else if (value.startsWith('theme:')) {
      setThemePreference(value.replace('theme:', '') as ThemePreference);
    } else if (value.startsWith('contrast:')) {
      setContrastPreference(value.replace('contrast:', '') as ContrastPreference);
    }
    // Don't close on select -- user may want to change both groups
  };

  const toggle = (toggleRef: React.Ref<MenuToggleElement>) => (
    <MenuToggle
      ref={toggleRef}
      onClick={onToggleClick}
      isExpanded={isOpen}
      className={className}
      aria-label="Theme selection"
      data-test="theme-dropdown-toggle"
    >
      <Flex gap={{ default: 'gapSm' }} alignItems={{ default: 'alignItemsCenter' }}>
        <FlexItem>
          {getColorSchemeIcon(preference, effectiveTheme)}{' '}
          {showText && <span>{THEME_PREFERENCE_LABELS[preference]}</span>}
        </FlexItem>
        <FlexItem>|</FlexItem>
        <FlexItem>
          {getContrastIcon(contrastPreference, effectiveContrast)}{' '}
          {showText && <span>{CONTRAST_PREFERENCE_LABELS[contrastPreference]}</span>}
        </FlexItem>
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
      <DropdownGroup label="Color scheme">
        <DropdownList>
          <DropdownItem
            value="theme:system"
            isSelected={preference === THEME_SYSTEM}
            data-test="theme-system"
            icon={<CogIcon />}
            description="Follow system preference"
          >
            {THEME_PREFERENCE_LABELS[THEME_SYSTEM]}
          </DropdownItem>
          <DropdownItem
            value="theme:light"
            isSelected={preference === THEME_LIGHT}
            data-test="theme-light"
            icon={<SunIcon />}
            description="Always use light mode"
          >
            {THEME_PREFERENCE_LABELS[THEME_LIGHT]}
          </DropdownItem>
          <DropdownItem
            value="theme:dark"
            isSelected={preference === THEME_DARK}
            data-test="theme-dark"
            icon={<MoonIcon />}
            description="Always use dark mode"
          >
            {THEME_PREFERENCE_LABELS[THEME_DARK]}
          </DropdownItem>
        </DropdownList>
      </DropdownGroup>
      <Divider />
      <DropdownGroup label="Contrast mode">
        <DropdownList>
          <DropdownItem
            value="contrast:system"
            isSelected={contrastPreference === CONTRAST_SYSTEM}
            data-test="contrast-system"
            icon={<CogIcon />}
            description="Follow system preference"
          >
            {CONTRAST_PREFERENCE_LABELS[CONTRAST_SYSTEM]}
          </DropdownItem>
          <DropdownItem
            value="contrast:default"
            isSelected={contrastPreference === CONTRAST_DEFAULT}
            data-test="contrast-default"
            icon={<EyeIcon />}
            description="Standard contrast for most users"
          >
            {CONTRAST_PREFERENCE_LABELS[CONTRAST_DEFAULT]}
          </DropdownItem>
          <DropdownItem
            value="contrast:high-contrast"
            isSelected={contrastPreference === CONTRAST_HIGH}
            data-test="contrast-high"
            icon={<AdjustIcon />}
            description="Increased contrast with stronger borders"
          >
            {CONTRAST_PREFERENCE_LABELS[CONTRAST_HIGH]}
          </DropdownItem>
        </DropdownList>
      </DropdownGroup>
    </Dropdown>
  );
};
