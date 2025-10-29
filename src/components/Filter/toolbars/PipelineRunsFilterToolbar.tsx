import React from 'react';
import {
  SearchInput,
  Toolbar,
  ToolbarContent,
  ToolbarItem,
  ToolbarGroup,
  ToolbarFilter,
  ToolbarToggleGroup,
} from '@patternfly/react-core';
import { FilterIcon } from '@patternfly/react-icons/dist/esm/icons/filter-icon';
import { MultiSelect } from '../generic/MultiSelect';
import { AttributeSelector } from '../utils/AttributeSelector';
import {
  PipelineRunsFilterState,
  clearFilter,
  ATTRIBUTE_OPTIONS,
  AttributeFilterType,
} from '../utils/pipelineruns-filter-utils';
import { useFilterAttribute } from '../utils/useFilterAttribute';

type PipelineRunsFilterToolbarProps = {
  filters: PipelineRunsFilterState;
  setFilters: (filters: PipelineRunsFilterState) => void;
  onClearFilters: () => void;
  typeOptions: { [key: string]: number };
  statusOptions: { [key: string]: number };
  openColumnManagement?: () => void;
  totalColumns?: number;
};

const PipelineRunsFilterToolbar: React.FC<PipelineRunsFilterToolbarProps> = ({
  filters,
  setFilters,
  onClearFilters,
  typeOptions,
  statusOptions,
  openColumnManagement,
  totalColumns,
}: PipelineRunsFilterToolbarProps) => {
  const { name, commit, status, type } = filters;

  // Use custom hook for attribute filtering logic
  const {
    activeAttribute,
    setActiveAttribute,
    currentValue,
    placeholder,
    handleTextInput,
    handleClearInput,
  } = useFilterAttribute({ filters, setFilters });

  // Handle filter clearing
  const handleClearFilter = (filterKey: keyof PipelineRunsFilterState) => {
    setFilters(clearFilter(filters, filterKey));
  };

  // Search input component
  const searchInput = (
    <SearchInput
      placeholder={placeholder}
      value={currentValue}
      onChange={(_event, value) => handleTextInput(value)}
      onClear={handleClearInput}
    />
  );

  return (
    <BaseTextFilterToolbar
      text={name}
      label="name"
      setText={(newName) => setFilters({ ...filters, name: newName })}
      onClearFilters={onClearFilters}
      openColumnManagement={openColumnManagement}
      totalColumns={totalColumns}
    >
      <MultiSelect
        label="Status"
        filterKey="status"
        values={status}
        setValues={(newFilters) => setFilters({ ...filters, status: newFilters })}
        options={statusOptions}
      />
      <MultiSelect
        label="Type"
        filterKey="type"
        values={type}
        setValues={(newFilters) => setFilters({ ...filters, type: newFilters })}
        options={typeOptions}
      />
    </BaseTextFilterToolbar>
  );
};

export default PipelineRunsFilterToolbar;
