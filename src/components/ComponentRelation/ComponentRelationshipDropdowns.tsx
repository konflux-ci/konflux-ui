import * as React from 'react';
import {
  Badge,
  Divider,
  Menu,
  MenuContainer,
  MenuContent,
  MenuGroup,
  MenuItem,
  MenuList,
  MenuSearch,
  MenuSearchInput,
  MenuToggle,
  SearchInput,
} from '@patternfly/react-core';
import { useField } from 'formik';
import { flatten } from 'lodash-es';

import './ComponentRelationshipDropdowns.scss';

type SelectComponentsDropdownProps = {
  children: React.ReactNode | React.ReactNode[];
  toggleText: string;
  onSelect: (item: string | number) => void;
  closeOnSelect?: boolean;
  badgeValue?: number;
};

const SelectComponentsDropdown: React.FC<SelectComponentsDropdownProps> = ({
  children,
  toggleText,
  onSelect,
  closeOnSelect,
  badgeValue,
}) => {
  const [isOpen, setIsOpen] = React.useState<boolean>(false);
  const toggleRef = React.useRef<HTMLButtonElement>(null);
  const menuRef = React.useRef<HTMLDivElement>(null);
  return (
    <MenuContainer
      isOpen={isOpen}
      onOpenChange={(o) => setIsOpen(o)}
      toggle={
        <MenuToggle
          ref={toggleRef}
          isExpanded={isOpen}
          onClick={() => setIsOpen(!isOpen)}
          id="toggle-component-menu"
          aria-label="toggle component menu"
          badge={badgeValue ? <Badge isRead>{badgeValue}</Badge> : null}
          isFullWidth
        >
          {toggleText}
        </MenuToggle>
      }
      menu={
        <Menu
          ref={menuRef}
          id="multi-select-component-menu"
          isScrollable
          onSelect={(_, item) => {
            onSelect(item);
            closeOnSelect && setIsOpen(false);
          }}
        >
          <MenuContent>{children}</MenuContent>
        </Menu>
      }
      toggleRef={toggleRef}
      menuRef={menuRef}
    />
  );
};

type MultiSelectComponentsDropdownProps = {
  groupedComponents: { [application: string]: string[] };
  sourceComponentName?: string;
  name: string;
};

export const MultiSelectComponentsDropdown: React.FC<MultiSelectComponentsDropdownProps> = ({
  sourceComponentName,
  groupedComponents,
  name,
}) => {
  const [{ value: selectedComponents }, , { setValue }] = useField<string[]>(name);

  // Sort the grouped components
  const sortedGroupedComponents = React.useMemo(() => {
    return Object.keys(groupedComponents)
      .sort()
      .reduce(
        (acc, key) => {
          acc[key] = [...groupedComponents[key]].sort();
          return acc;
        },
        {} as { [application: string]: string[] },
      );
  }, [groupedComponents]);

  const componentNames = flatten(Object.values(sortedGroupedComponents));

  const [selectAll, setSelectAll] = React.useState<boolean>(
    componentNames.length - 1 === selectedComponents.length,
  );
  const [searchQuery, setSearchQuery] = React.useState<string>('');

  const filteredComponents = React.useMemo(() => {
    if (!searchQuery) return sortedGroupedComponents;
    const lowerQuery = searchQuery.toLowerCase();
    return Object.entries(sortedGroupedComponents).reduce(
      (acc, [app, components]) => {
        const filtered = components.filter((c) => c.toLowerCase().includes(lowerQuery));
        if (filtered.length) acc[app] = filtered;
        return acc;
      },
      {} as { [application: string]: string[] },
    );
  }, [searchQuery, sortedGroupedComponents]);

  const handleSelect = React.useCallback(
    (item: string) => {
      if (item === 'select-all') {
        if (selectAll) {
          void setValue([]);
          setSelectAll(false);
        } else {
          const selected = componentNames.filter((v) => v !== sourceComponentName);
          void setValue(selected);
          setSelectAll(true);
        }
      } else {
        if (selectedComponents.includes(item)) {
          const selectedItems = selectedComponents.filter((v) => v !== item);
          void setValue(selectedItems);
        } else {
          void setValue([...selectedComponents, item]);
        }
      }
    },
    [componentNames, selectAll, setValue, sourceComponentName, selectedComponents],
  );

  return (
    <SelectComponentsDropdown
      toggleText="Choose components to nudge"
      onSelect={handleSelect}
      badgeValue={selectedComponents.length || null}
    >
      <MenuSearch>
        <MenuSearchInput>
          <SearchInput
            type="text"
            value={searchQuery}
            onChange={(_, searchValue) => setSearchQuery(searchValue)}
            placeholder="Search components..."
            aria-label="Search components"
          />
        </MenuSearchInput>
      </MenuSearch>
      <Divider component="li" />
      <MenuGroup className="menugroup">
        <MenuList>
          <MenuItem hasCheckbox itemId="select-all" isSelected={selectAll}>
            Select all
          </MenuItem>
        </MenuList>
      </MenuGroup>
      <Divider component="li" />
      {Object.entries(filteredComponents).map(([application, components]) => (
        <MenuGroup key={application} label={application}>
          <MenuList>
            {components.map((component) => {
              const isSelected = selectedComponents.includes(component);
              const isDisabled = component === sourceComponentName;
              return (
                <MenuItem
                  key={component}
                  hasCheckbox
                  itemId={component}
                  isSelected={isSelected}
                  isDisabled={isDisabled}
                  tooltipProps={
                    isDisabled
                      ? {
                          trigger: 'mouseenter',
                          content: 'This component is already in the relationship.',
                          zIndex: 1000,
                        }
                      : undefined
                  }
                >
                  {component}
                </MenuItem>
              );
            })}
          </MenuList>
        </MenuGroup>
      ))}
    </SelectComponentsDropdown>
  );
};

type SingleSelectComponentDropdownProps = {
  componentNames: string[];
  name: string;
  disableMenuItem?: (item: string) => boolean;
};

export const SingleSelectComponentDropdown: React.FC<SingleSelectComponentDropdownProps> = ({
  componentNames,
  name,
  disableMenuItem,
}) => {
  const [{ value }, , { setValue }] = useField<string>(name);
  const [searchQuery, setSearchQuery] = React.useState<string>('');

  // Sort component names
  const sortedComponentNames = React.useMemo(() => [...componentNames].sort(), [componentNames]);

  const filteredComponents = React.useMemo(
    () =>
      searchQuery
        ? sortedComponentNames.filter((c) => c.toLowerCase().includes(searchQuery.toLowerCase()))
        : sortedComponentNames,
    [searchQuery, sortedComponentNames],
  );

  const handleSelect = React.useCallback(
    (item: string) => {
      void setValue(item);
    },
    [setValue],
  );

  return (
    <SelectComponentsDropdown
      toggleText={value || 'Select a component'}
      onSelect={handleSelect}
      closeOnSelect
    >
      <MenuSearch>
        <MenuSearchInput>
          <SearchInput
            type="text"
            value={searchQuery}
            onChange={(_, searchValue) => setSearchQuery(searchValue)}
            placeholder="Search components..."
            aria-label="Search components"
          />
        </MenuSearchInput>
      </MenuSearch>
      <Divider component="li" />
      <MenuList>
        {filteredComponents.map((component) => (
          <MenuItem
            key={component}
            itemId={component}
            selected={value === component}
            isDisabled={disableMenuItem?.(component)}
            tooltipProps={
              disableMenuItem?.(component)
                ? {
                    appendTo: () => document.querySelector('#hacDev-modal-container'),
                    content: 'This component is already in the relationship.',
                  }
                : undefined
            }
          >
            {component}
          </MenuItem>
        ))}
      </MenuList>
    </SelectComponentsDropdown>
  );
};
