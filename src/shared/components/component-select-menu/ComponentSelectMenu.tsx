import React from 'react';
import {
  Divider,
  MenuGroup,
  MenuItem,
  MenuList,
  MenuSearch,
  MenuSearchInput,
  SearchInput,
} from '@patternfly/react-core';
import { useField } from 'formik';
import { flatten } from 'lodash-es';
import SelectComponentsDropdown from './SelectComponnetsDropdown';
import './ComponentSelectMenu.scss';

type ComponentSelectMenuProps = {
  name: string;
  options: string[] | { [application: string]: string[] };
  isMulti?: boolean;
  disableItem?: (item: string) => boolean;
  sourceComponentName?: string;
  includeSelectAll?: boolean;
  defaultToggleText?: string;
  selectedToggleText?: string | ((value: string | string[]) => string);
  title?: string;
};

export const ComponentSelectMenu: React.FC<ComponentSelectMenuProps> = ({
  name,
  options,
  isMulti = false,
  disableItem,
  sourceComponentName,
  includeSelectAll = false,
  defaultToggleText = 'Select components',
  selectedToggleText = 'Select components',
}) => {
  const [{ value }, , { setValue }] = useField<string[] | string>(name);
  const [searchQuery, setSearchQuery] = React.useState<string>('');
  const isGrouped = typeof options === 'object' && !Array.isArray(options);

  const allItems = React.useMemo(() => {
    if (isGrouped) {
      return flatten(Object.values(options));
    }
    return options;
  }, [isGrouped, options]);

  const isItemDisabled = (item: string) => disableItem?.(item) || item === sourceComponentName;
  const isSelected = (item: string) =>
    isMulti ? (value as string[])?.includes(item) : (value as string) === item;

  const handleSelect = (item: string) => {
    if (includeSelectAll && item === 'select-all') {
      if (!isMulti) return;
      const selectable = allItems?.filter((v) => !isItemDisabled(v));
      const selectedCount = Array.isArray(value) ? value.length : 0;

      if (selectedCount === selectable.length) {
        void setValue([]);
      } else {
        void setValue(selectable);
      }
    } else {
      if (isMulti) {
        const selected = Array.isArray(value) ? value : [];
        const newValue = selected.includes(item)
          ? selected.filter((v) => v !== item)
          : [...selected, item];
        void setValue(newValue);
      } else {
        void setValue(item);
      }
    }
  };

  const filteredOptions = React.useMemo(() => {
    const query = searchQuery.toLowerCase();
    const filterFn = (items: string[]) => items?.filter((i) => i.toLowerCase()?.includes(query));

    if (isGrouped) {
      return Object.entries(options).reduce(
        (acc, [group, items]) => {
          const filtered = filterFn(items);
          if (filtered?.length) acc[group] = filtered;
          return acc;
        },
        {} as Record<string, string[]>,
      );
    }
    return filterFn(options);
  }, [isGrouped, options, searchQuery]);

  const toggleText = React.useMemo(() => {
    const selectedComponents = value as string[];
    if (typeof selectedToggleText === 'function') {
      return selectedToggleText(value);
    }
    return selectedComponents?.length > 0 ? selectedToggleText : defaultToggleText;
  }, [defaultToggleText, value, selectedToggleText]);

  return (
    <>
      <SelectComponentsDropdown
        toggleText={toggleText}
        onSelect={handleSelect}
        closeOnSelect={!isMulti}
        badgeValue={isMulti ? (value as string[])?.length : undefined}
      >
        <MenuSearch>
          <MenuSearchInput>
            <SearchInput
              type="text"
              value={searchQuery}
              onChange={(_, v) => setSearchQuery(v)}
              placeholder="Search components..."
              aria-label="Search components"
            />
          </MenuSearchInput>
        </MenuSearch>
        <Divider component="li" />
        {includeSelectAll && isMulti && (
          <>
            <MenuGroup className="menugroup" label="Components">
              <MenuList>
                <MenuItem
                  hasCheckbox
                  itemId="select-all"
                  isSelected={(value as string[])?.length === allItems?.length}
                >
                  Select all
                </MenuItem>
              </MenuList>
            </MenuGroup>
            <Divider component="li" />
          </>
        )}
        {isGrouped ? (
          Object.entries(filteredOptions as Record<string, string[]>).map(([group, items]) => (
            <MenuGroup key={group} label={group}>
              <MenuList>
                {items?.map((item) => (
                  <MenuItem
                    key={item}
                    itemId={item}
                    hasCheckbox={isMulti}
                    isSelected={isSelected(item)}
                    isDisabled={isItemDisabled(item)}
                    tooltipProps={
                      isItemDisabled(item)
                        ? {
                            content: 'This component is already in the relationship.',
                            zIndex: 1000,
                          }
                        : undefined
                    }
                  >
                    {item}
                  </MenuItem>
                ))}
              </MenuList>
            </MenuGroup>
          ))
        ) : (
          <MenuList>
            {(filteredOptions as string[])?.map((item) => (
              <MenuItem
                key={item}
                itemId={item}
                selected={!isMulti && isSelected(item)}
                isDisabled={isItemDisabled(item)}
              >
                {item}
              </MenuItem>
            ))}
          </MenuList>
        )}
      </SelectComponentsDropdown>
    </>
  );
};
