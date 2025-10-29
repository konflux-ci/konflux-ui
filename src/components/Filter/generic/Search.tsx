import React, { useCallback, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SearchInput, ToolbarFilter, ToolbarItem } from '@patternfly/react-core';
import { AttributeSelector } from '../utils/AttributeSelector';
import { FilterConfig } from './FilterConfig';

interface SearchFilterProps {
  config: FilterConfig;
  dataTestId?: string;
}

export const SearchFilter: React.FC<SearchFilterProps> = ({ config, dataTestId }) => {
  const [searchParams, setSearchParams] = useSearchParams();

  // For multi-attribute search, manage active attribute state
  const [activeAttribute, setActiveAttribute] = useState<string>(
    config.searchAttributes?.defaultAttribute ||
      config.searchAttributes?.attributes[0]?.key ||
      'name',
  );

  // Determine if this is a multi-attribute search
  const isMultiAttribute = config.searchAttributes && config.searchAttributes.attributes.length > 1;

  // For single attribute or simple search, use the config param
  // For multi-attribute, use the active attribute as the URL param
  const currentParam = isMultiAttribute ? activeAttribute : config.param;
  const urlValue = searchParams.get(currentParam) || '';

  const handleInputChange = useCallback(
    (_event: React.FormEvent, value: string) => {
      const newParams = new URLSearchParams(searchParams);
      if (value.trim()) {
        newParams.set(currentParam, value.trim());
      } else {
        newParams.delete(currentParam);
      }
      setSearchParams(newParams);
    },
    [currentParam, searchParams, setSearchParams],
  );

  const handleClear = useCallback(() => {
    const newParams = new URLSearchParams(searchParams);
    newParams.delete(currentParam);
    setSearchParams(newParams);
  }, [currentParam, searchParams, setSearchParams]);

  const handleDeleteChip = useCallback(() => {
    handleClear();
  }, [handleClear]);

  const handleAttributeChange = useCallback(
    (newAttribute: string) => {
      // Validate that the new attribute is valid
      if (!config.searchAttributes?.attributes.some((attr) => attr.key === newAttribute)) {
        return;
      }

      // Clear the current search when switching attributes
      const newParams = new URLSearchParams(searchParams);
      newParams.delete(activeAttribute); // Clear current attribute
      setSearchParams(newParams);
      setActiveAttribute(newAttribute);
    },
    [activeAttribute, searchParams, setSearchParams, config.searchAttributes],
  );

  // Get current attribute info for placeholder and label
  const currentAttribute = config.searchAttributes?.attributes.find(
    (attr) => attr.key === activeAttribute,
  );
  const chips = urlValue ? [urlValue] : [];

  // Generate placeholder
  let placeholder: string;
  if (config.placeholder) {
    placeholder = config.placeholder;
  } else if (isMultiAttribute && config.searchAttributes?.getPlaceholder) {
    placeholder = config.searchAttributes.getPlaceholder(activeAttribute);
  } else if (currentAttribute) {
    placeholder = `Filter by ${currentAttribute.label.toLowerCase()}...`;
  } else {
    placeholder = `Search ${config.label || config.param}...`;
  }

  // Generate category name for chips
  const categoryName = isMultiAttribute
    ? currentAttribute?.label || activeAttribute
    : config.label || config.param;

  // Render multi-attribute search (with AttributeSelector)
  if (isMultiAttribute) {
    return (
      <>
        <ToolbarItem>
          <AttributeSelector
            options={config.searchAttributes.attributes}
            activeAttribute={activeAttribute}
            onAttributeChange={handleAttributeChange}
          />
        </ToolbarItem>
        <ToolbarFilter
          chips={chips}
          deleteChip={handleDeleteChip}
          deleteChipGroup={handleDeleteChip}
          categoryName={categoryName}
          showToolbarItem
        >
          <SearchInput
            placeholder={placeholder}
            value={urlValue}
            onChange={handleInputChange}
            onClear={handleClear}
            data-testid={dataTestId}
          />
        </ToolbarFilter>
      </>
    );
  }

  // Render simple search (original behavior)
  return (
    <ToolbarFilter
      chips={chips}
      deleteChip={handleDeleteChip}
      deleteChipGroup={handleDeleteChip}
      categoryName={categoryName}
      showToolbarItem
    >
      <SearchInput
        placeholder={placeholder}
        value={urlValue}
        onChange={handleInputChange}
        onClear={handleClear}
        data-testid={dataTestId}
      />
    </ToolbarFilter>
  );
};
