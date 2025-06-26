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
};

const PipelineRunsFilterToolbar: React.FC<PipelineRunsFilterToolbarProps> = ({
  filters,
  setFilters,
  onClearFilters,
  typeOptions,
  statusOptions,
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
    <Toolbar id="pipeline-runs-filter-toolbar" clearAllFilters={onClearFilters}>
      <ToolbarContent>
        <ToolbarToggleGroup toggleIcon={<FilterIcon />} breakpoint="xl">
          <ToolbarGroup variant="filter-group">
            <ToolbarItem>
              <AttributeSelector
                options={ATTRIBUTE_OPTIONS}
                activeAttribute={activeAttribute}
                onAttributeChange={(attr) => setActiveAttribute(attr as AttributeFilterType)}
              />
            </ToolbarItem>
            <ToolbarFilter
              chips={name !== '' ? [name] : ([] as string[])}
              deleteChip={() => handleClearFilter('name')}
              deleteChipGroup={() => handleClearFilter('name')}
              categoryName="Name"
              showToolbarItem={activeAttribute === 'name'}
            >
              {activeAttribute === 'name' ? searchInput : null}
            </ToolbarFilter>
            <ToolbarFilter
              chips={commit !== '' ? [commit] : ([] as string[])}
              deleteChip={() => handleClearFilter('commit')}
              deleteChipGroup={() => handleClearFilter('commit')}
              categoryName="Commit"
              showToolbarItem={activeAttribute === 'commit'}
            >
              {activeAttribute === 'commit' ? searchInput : null}
            </ToolbarFilter>
          </ToolbarGroup>
        </ToolbarToggleGroup>
        <ToolbarItem>
          <MultiSelect
            label="Status"
            filterKey="status"
            values={status}
            setValues={(newFilters) => setFilters({ ...filters, status: newFilters })}
            options={statusOptions}
          />
        </ToolbarItem>
        <ToolbarItem>
          <MultiSelect
            label="Type"
            filterKey="type"
            values={type}
            setValues={(newFilters) => setFilters({ ...filters, type: newFilters })}
            options={typeOptions}
          />
        </ToolbarItem>
      </ToolbarContent>
    </Toolbar>
  );
};

export default PipelineRunsFilterToolbar;
