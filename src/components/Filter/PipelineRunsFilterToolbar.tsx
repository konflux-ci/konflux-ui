import {
  SearchInput,
  Toolbar,
  ToolbarContent,
  ToolbarGroup,
  ToolbarItem,
} from '@patternfly/react-core';
import { debounce } from 'lodash-es';
import { MultiSelect } from './generic/MultiSelect';

type PipelineRunsFilterToolbarProps = {
  nameFilter: string;
  setNameFilter: (name: string) => void;
  statusFilters: string[];
  setStatusFilters: (filters: string[]) => void;
  statusOptions: { [key: string]: number };
  typeFilters: string[];
  setTypeFilters: (filters: string[]) => void;
  typeOptions: { [key: string]: number };
  clearAllFilters: () => void;
};

const PipelineRunsFilterToolbar: React.FC<PipelineRunsFilterToolbarProps> = ({
  nameFilter,
  setNameFilter,
  statusFilters,
  setStatusFilters,
  statusOptions,
  typeFilters,
  setTypeFilters,
  typeOptions,
  clearAllFilters,
}: PipelineRunsFilterToolbarProps) => {
  const onNameInput = debounce((n: string) => {
    setNameFilter(n);
  }, 600);

  return (
    <Toolbar data-test="pipelinerun-list-toolbar" clearAllFilters={clearAllFilters}>
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
              value={nameFilter}
            />
          </ToolbarItem>
          <ToolbarItem>
            <MultiSelect
              label="Status"
              filterKey="status"
              values={statusFilters}
              setValues={setStatusFilters}
              options={statusOptions}
            />
          </ToolbarItem>
          <ToolbarItem>
            <MultiSelect
              label="Type"
              filterKey="type"
              values={typeFilters}
              setValues={setTypeFilters}
              options={typeOptions}
            />
          </ToolbarItem>
        </ToolbarGroup>
      </ToolbarContent>
    </Toolbar>
  );
};

export default PipelineRunsFilterToolbar;
