import { MultiSelect } from '../generic/MultiSelect';
import { PipelineRunsFilterStateV2 } from '../utils/pipelineruns-filter-utils-v2';
import { BaseTextFilterToolbar } from './BaseTextFIlterToolbar';

type PipelineRunsFilterToolbarPropsV2 = {
  filters: PipelineRunsFilterStateV2;
  setFilters: (PipelineRunsFilterState) => void;
  onClearFilters: () => void;
  typeOptions: { [key: string]: number };
  statusOptions: { [key: string]: number };
  versionOptions?: { [key: string]: number };
  versionLabels?: Record<string, string>;
  openColumnManagement?: () => void;
  totalColumns?: number;
};

const PipelineRunsFilterToolbarV2: React.FC<PipelineRunsFilterToolbarPropsV2> = ({
  filters,
  setFilters,
  onClearFilters,
  typeOptions,
  statusOptions,
  versionOptions,
  versionLabels,
  openColumnManagement,
  totalColumns,
}: PipelineRunsFilterToolbarPropsV2) => {
  const { name, status, type, version } = filters;

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
      {versionOptions && (
        <MultiSelect
          label="Version"
          filterKey="version"
          values={version ?? []}
          setValues={(newFilters) => setFilters({ ...filters, version: newFilters })}
          options={versionOptions}
          optionLabels={versionLabels}
        />
      )}
    </BaseTextFilterToolbar>
  );
};

export default PipelineRunsFilterToolbarV2;
