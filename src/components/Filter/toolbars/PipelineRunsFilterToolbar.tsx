import { MultiSelect } from '../generic/MultiSelect';
import { PipelineRunsFilterState } from '../utils/pipelineruns-filter-utils';
import { BaseTextFilterToolbar } from './BaseTextFIlterToolbar';

type PipelineRunsFilterToolbarProps = {
  filters: PipelineRunsFilterState;
  setFilters: (filters: PipelineRunsFilterState) => void;
  onClearFilters: () => void;
  typeOptions: { [key: string]: number };
  statusOptions: { [key: string]: number };
  filterOptions?: string[];
  openColumnManagement?: () => void;
  totalColumns?: number;
};

const PipelineRunsFilterToolbar: React.FC<PipelineRunsFilterToolbarProps> = ({
  filters,
  setFilters,
  onClearFilters,
  typeOptions,
  statusOptions,
  filterOptions,
  openColumnManagement,
  totalColumns,
}: PipelineRunsFilterToolbarProps) => {
  const { name, status, type } = filters;

  return (
    <BaseTextFilterToolbar
      text={name}
      label="name"
      setText={(newSearchValue, searchType) => {
        switch (searchType) {
          case 'Version':
            return setFilters({ ...filters, version: newSearchValue, name: '' });
          case 'Name':
          default:
            return setFilters({ ...filters, name: newSearchValue, version: '' });
        }
      }}
      onClearFilters={onClearFilters}
      openColumnManagement={openColumnManagement}
      totalColumns={totalColumns}
      filterOptions={filterOptions}
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
