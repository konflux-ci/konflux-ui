import { Dispatch } from 'react';
import {
  SearchInput,
  Toolbar,
  ToolbarContent,
  ToolbarGroup,
  ToolbarItem,
} from '@patternfly/react-core';
import { debounce } from 'lodash-es';
import { MultiSelect } from './generic/MultiSelect';
import {
  PipelineRunsFilterAction,
  PipelineRunsFilterState,
} from './utils/pipelineruns-filter-utils';

type PipelineRunsFilterToolbarProps = {
  filters: PipelineRunsFilterState;
  dispatchFilters: Dispatch<PipelineRunsFilterAction>;
  typeOptions: { [key: string]: number };
  statusOptions: { [key: string]: number };
};

const PipelineRunsFilterToolbar: React.FC<PipelineRunsFilterToolbarProps> = ({
  filters,
  dispatchFilters,
  typeOptions,
  statusOptions,
}: PipelineRunsFilterToolbarProps) => {
  const { nameFilter, statusFilter, typeFilter } = filters;

  const onNameInput = debounce((n: string) => {
    dispatchFilters({ type: 'SET_NAME', payload: n });
  }, 600);

  return (
    <Toolbar
      data-test="pipelinerun-list-toolbar"
      clearAllFilters={() => dispatchFilters({ type: 'CLEAR_ALL_FILTERS' })}
    >
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
              values={statusFilter}
              setValues={(newFilters) =>
                dispatchFilters({ type: 'SET_STATUS', payload: newFilters })
              }
              options={statusOptions}
            />
          </ToolbarItem>
          <ToolbarItem>
            <MultiSelect
              label="Type"
              filterKey="type"
              values={typeFilter}
              setValues={(newFilters) => dispatchFilters({ type: 'SET_TYPE', payload: newFilters })}
              options={typeOptions}
            />
          </ToolbarItem>
        </ToolbarGroup>
      </ToolbarContent>
    </Toolbar>
  );
};

export default PipelineRunsFilterToolbar;
