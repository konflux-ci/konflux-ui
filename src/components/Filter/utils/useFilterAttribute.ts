import React from 'react';
import {
  PipelineRunsFilterState,
  AttributeFilterType,
  updateFilterByAttribute,
  getCurrentFilterValue,
  getPlaceholderText,
} from './pipelineruns-filter-utils';

export interface UseFilterAttributeProps {
  filters: PipelineRunsFilterState;
  setFilters: (filters: PipelineRunsFilterState) => void;
}

export const useFilterAttribute = ({ filters, setFilters }: UseFilterAttributeProps) => {
  const [activeAttribute, setActiveAttribute] = React.useState<AttributeFilterType>('name');

  const handleTextInput = React.useCallback(
    (value: string) => {
      const updatedFilters = updateFilterByAttribute(filters, activeAttribute, value);
      setFilters(updatedFilters);
    },
    [filters, activeAttribute, setFilters],
  );

  const handleClearInput = React.useCallback(() => {
    const updatedFilters = updateFilterByAttribute(filters, activeAttribute, '');
    setFilters(updatedFilters);
  }, [filters, activeAttribute, setFilters]);

  const currentValue = getCurrentFilterValue(filters, activeAttribute);
  const placeholder = getPlaceholderText(activeAttribute);

  return {
    activeAttribute,
    setActiveAttribute,
    currentValue,
    placeholder,
    handleTextInput,
    handleClearInput,
  };
};
