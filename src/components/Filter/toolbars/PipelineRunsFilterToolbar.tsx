import { MultiSelect } from '../generic/MultiSelect';
import { createTextSearchFilterObj } from '../utils/filter-utils';
import { PipelineRunsFilterState } from '../utils/pipelineruns-filter-utils';
import { BaseTextFilterToolbar } from './BaseTextFIlterToolbar';

type PipelineRunsFilterToolbarProps = {
  filters: PipelineRunsFilterState;
  setFilters: (filters: PipelineRunsFilterState) => void;
  onClearFilters: () => void;
  typeOptions?: { key: string; count?: number; label?: string }[];
  statusOptions?: { key: string; count?: number; label?: string }[];
  searchOptions?: string[];
  openColumnManagement?: () => void;
  totalColumns?: number;
};

const PipelineRunsFilterToolbar: React.FC<PipelineRunsFilterToolbarProps> = ({
  filters,
  setFilters,
  onClearFilters,
  typeOptions,
  statusOptions,
  searchOptions,
  openColumnManagement,
  totalColumns,
}: PipelineRunsFilterToolbarProps) => {
  const { name, status, type, version } = filters;

  return (
    <BaseTextFilterToolbar
      text={name || (version ?? '')}
      label="name"
      setText={(newName, searchType) =>
        createTextSearchFilterObj(newName, searchType, filters, setFilters)
      }
      onClearFilters={onClearFilters}
      openColumnManagement={openColumnManagement}
      totalColumns={totalColumns}
      searchOptions={searchOptions}
    >
      {statusOptions && (
        <MultiSelect
          label="Status"
          filterKey="status"
          values={status}
          setValues={(newFilters) => setFilters({ ...filters, status: newFilters })}
          options={statusOptions}
        />
      )}
      {typeOptions && (
        <MultiSelect
          label="Type"
          filterKey="type"
          values={type}
          setValues={(newFilters) => setFilters({ ...filters, type: newFilters })}
          options={typeOptions}
        />
      )}
    </BaseTextFilterToolbar>
  );
};

export default PipelineRunsFilterToolbar;
