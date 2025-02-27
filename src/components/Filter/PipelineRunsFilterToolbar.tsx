import {
  SearchInput,
  Toolbar,
  ToolbarContent,
  ToolbarGroup,
  ToolbarItem,
} from '@patternfly/react-core';
import { debounce } from 'lodash-es';
import { MultiSelect } from './generic/MultiSelect';
import { PipelineRunsFilterState } from './utils/pipelineruns-filter-utils';

type PipelineRunsFilterToolbarProps = {
  filters: PipelineRunsFilterState;
  setFilters: (PipelineRunsFilterState) => void;
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
  const { name, status, type } = filters;

  const onNameInput = debounce((newName: string) => {
    setFilters({ ...filters, name: newName });
  }, 600);

  return (
    <Toolbar data-test="pipelinerun-list-toolbar" clearAllFilters={onClearFilters}>
      <ToolbarContent>
        <ToolbarGroup align={{ default: 'alignLeft' }}>
          <ToolbarItem className="pf-v5-u-ml-0">
            <SearchInput
              name="nameInput"
              data-test="name-input-filter"
              type="search"
              aria-label="name filter"
              placeholder="Filter by name..."
              onChange={(_, n) => onNameInput(n)}
              value={name}
            />
          </ToolbarItem>
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
        </ToolbarGroup>
      </ToolbarContent>
    </Toolbar>
  );
};

export default PipelineRunsFilterToolbar;
