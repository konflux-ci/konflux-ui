import React from 'react';
import { debounce } from 'lodash-es';
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
  debounceMs?: number;
}

export const useFilterAttribute = ({
  filters,
  setFilters,
  debounceMs = 600,
}: UseFilterAttributeProps) => {
  const [activeAttribute, setActiveAttribute] = React.useState<AttributeFilterType>('name');

  // Create debounced handler for text input
  const debouncedUpdate = React.useMemo(
    () =>
      debounce((value: string) => {
        const updatedFilters = updateFilterByAttribute(filters, activeAttribute, value);
        setFilters(updatedFilters);
      }, debounceMs),
    [filters, activeAttribute, setFilters, debounceMs],
  );

  // Cleanup debounced function on unmount
  React.useEffect(() => {
    return () => {
      debouncedUpdate.cancel();
    };
  }, [debouncedUpdate]);

  const handleTextInput = React.useCallback(
    (value: string) => {
      debouncedUpdate(value);
    },
    [debouncedUpdate],
  );

  const handleClearInput = React.useCallback(() => {
    debouncedUpdate.cancel();
    const updatedFilters = updateFilterByAttribute(filters, activeAttribute, '');
    setFilters(updatedFilters);
  }, [debouncedUpdate, filters, activeAttribute, setFilters]);

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
