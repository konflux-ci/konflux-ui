import * as React from 'react';
import { MultiSelect } from '../generic/MultiSelect';
import { PipelineRunsFilterState } from '../utils/pipelineruns-filter-utils';
import { BaseTextFilterToolbar } from './BaseTextFIlterToolbar';

type PipelineRunsFilterToolbarProps = {
  filters: PipelineRunsFilterState;
  setFilters: (PipelineRunsFilterState) => void;
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

  // Track which filter type is selected (independent of field values)
  const [selectedFilterType, setSelectedFilterType] = React.useState<string>(() => {
    // Initialize based on which URL parameter is present
    return commit ? 'commit' : 'name';
  });

  const searchText = commit || name;

  // Use refs to avoid recreating callback when filters change
  const selectedFilterTypeRef = React.useRef(selectedFilterType);
  const filtersRef = React.useRef(filters);
  selectedFilterTypeRef.current = selectedFilterType;
  filtersRef.current = filters;

  const handleSetText = React.useCallback(
    (newText: string) => {
      const currentFilters = filtersRef.current;
      if (selectedFilterTypeRef.current === 'commit') {
        setFilters({
          name: '',
          commit: newText,
          status: currentFilters.status,
          type: currentFilters.type,
        });
      } else {
        setFilters({
          name: newText,
          commit: '',
          status: currentFilters.status,
          type: currentFilters.type,
        });
      }
    },
    [setFilters],
  );

  const handleFilterTypeChange = React.useCallback(
    (newFilterType: string) => {
      // Update the selected filter type
      setSelectedFilterType(newFilterType);
      // Clear both fields when switching filter type
      const currentFilters = filtersRef.current;
      setFilters({
        name: '',
        commit: '',
        status: currentFilters.status,
        type: currentFilters.type,
      });
    },
    [setFilters],
  );

  const handleSetStatus = React.useCallback(
    (newStatus: string[]) => {
      const currentFilters = filtersRef.current;
      setFilters({
        name: currentFilters.name,
        commit: currentFilters.commit,
        status: newStatus,
        type: currentFilters.type,
      });
    },
    [setFilters],
  );

  const handleSetType = React.useCallback(
    (newType: string[]) => {
      const currentFilters = filtersRef.current;
      setFilters({
        name: currentFilters.name,
        commit: currentFilters.commit,
        status: currentFilters.status,
        type: newType,
      });
    },
    [setFilters],
  );

  return (
    <BaseTextFilterToolbar
      text={searchText}
      label="name"
      setText={handleSetText}
      onClearFilters={onClearFilters}
      openColumnManagement={openColumnManagement}
      totalColumns={totalColumns}
      filterOptions={['name', 'commit']}
      selectedFilterOption={selectedFilterType}
      onFilterTypeChange={handleFilterTypeChange}
    >
      <MultiSelect
        label="Status"
        filterKey="status"
        values={status}
        setValues={handleSetStatus}
        options={statusOptions}
      />
      <MultiSelect
        label="Type"
        filterKey="type"
        values={type}
        setValues={handleSetType}
        options={typeOptions}
      />
    </BaseTextFilterToolbar>
  );
};

export default PipelineRunsFilterToolbar;
