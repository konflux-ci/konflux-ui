import { useState } from 'react';
import {
  SearchInput,
  Toolbar,
  ToolbarContent,
  ToolbarGroup,
  ToolbarItem,
} from '@patternfly/react-core';
import {
  Select,
  SelectGroup,
  SelectOption,
  SelectVariant,
} from '@patternfly/react-core/deprecated';
import { FilterIcon } from '@patternfly/react-icons/dist/esm/icons/filter-icon';
import { debounce } from 'lodash-es';

type PipelineRunsFilterToolbarProps = {
  nameFilter: string;
  setNameFilter: (name: string) => void;
  statusFilters: string[];
  setStatusFilters: (filters: string[]) => void;
  statusOptions: { [key: string]: number };
  typeFilters: string[];
  setTypeFilters: (filters: string[]) => void;
  typeOptions: { [key: string]: number };
  onLoadName: string;
  setOnLoadName: (name: string) => void;
  onClearFilters: () => void;
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
  onLoadName,
  setOnLoadName,
  onClearFilters,
}: PipelineRunsFilterToolbarProps) => {
  const [statusFilterExpanded, setStatusFilterExpanded] = useState(false);
  const [typeFilterExpanded, setTypeFilterExpanded] = useState(false);

  const onNameInput = debounce((n: string) => {
    n.length === 0 && onLoadName.length && setOnLoadName('');

    setNameFilter(n);
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
              value={nameFilter}
            />
          </ToolbarItem>
          <ToolbarItem>
            <Select
              placeholderText="Status"
              toggleIcon={<FilterIcon />}
              toggleAriaLabel="Status filter menu"
              variant={SelectVariant.checkbox}
              isOpen={statusFilterExpanded}
              onToggle={(_, expanded) => setStatusFilterExpanded(expanded)}
              onSelect={(event, selection) => {
                const checked = (event.target as HTMLInputElement).checked;
                setStatusFilters(
                  checked
                    ? [...statusFilters, String(selection)]
                    : statusFilters.filter((value) => value !== selection),
                );
              }}
              selections={statusFilters}
              isGrouped
            >
              {[
                <SelectGroup label="Status" key="status">
                  {Object.keys(statusOptions).map((filter) => (
                    <SelectOption
                      key={filter}
                      value={filter}
                      isChecked={statusFilters.includes(filter)}
                      itemCount={statusOptions[filter] ?? 0}
                    >
                      {filter}
                    </SelectOption>
                  ))}
                </SelectGroup>,
              ]}
            </Select>
          </ToolbarItem>
          <ToolbarItem>
            <Select
              placeholderText="Type"
              toggleIcon={<FilterIcon />}
              toggleAriaLabel="Type filter menu"
              variant={SelectVariant.checkbox}
              isOpen={typeFilterExpanded}
              onToggle={(_, expanded) => setTypeFilterExpanded(expanded)}
              onSelect={(event, selection) => {
                const checked = (event.target as HTMLInputElement).checked;
                setTypeFilters(
                  checked
                    ? [...typeFilters, String(selection)]
                    : typeFilters.filter((value) => value !== selection),
                );
              }}
              selections={typeFilters}
              isGrouped
            >
              {[
                <SelectGroup label="Type" key="type">
                  {Object.keys(typeOptions).map((filter) => (
                    <SelectOption
                      key={filter}
                      value={filter}
                      isChecked={typeFilters.includes(filter)}
                      itemCount={typeOptions[filter] ?? 0}
                    >
                      {filter}
                    </SelectOption>
                  ))}
                </SelectGroup>,
              ]}
            </Select>
          </ToolbarItem>
        </ToolbarGroup>
      </ToolbarContent>
    </Toolbar>
  );
};

export default PipelineRunsFilterToolbar;
