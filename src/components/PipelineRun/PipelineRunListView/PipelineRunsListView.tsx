import * as React from 'react';
import {
  Bullseye,
  SearchInput,
  Spinner,
  Stack,
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
import { PipelineRunLabel, PipelineRunType } from '../../../consts/pipelinerun';
import { useComponents } from '../../../hooks/useComponents';
import { usePipelineRuns } from '../../../hooks/usePipelineRuns';
import { usePLRVulnerabilities } from '../../../hooks/useScanResults';
import { useSearchParam } from '../../../hooks/useSearchParam';
import { HttpError } from '../../../k8s/error';
import { Table } from '../../../shared';
import ErrorEmptyState from '../../../shared/components/empty-state/ErrorEmptyState';
import FilteredEmptyState from '../../../shared/components/empty-state/FilteredEmptyState';
import { PipelineRunKind } from '../../../types';
import { statuses } from '../../../utils/commits-utils';
import { pipelineRunStatus } from '../../../utils/pipeline-utils';
import { useWorkspaceInfo } from '../../Workspace/useWorkspaceInfo';
import PipelineRunEmptyState from '../PipelineRunEmptyState';
import { PipelineRunListHeaderWithVulnerabilities } from './PipelineRunListHeader';
import { PipelineRunListRowWithVulnerabilities } from './PipelineRunListRow';

const pipelineRunTypes = [PipelineRunType.BUILD as string, PipelineRunType.TEST as string];

type PipelineRunsListViewProps = {
  applicationName: string;
  componentName?: string;
  customFilter?: (plr: PipelineRunKind) => boolean;
};

const PipelineRunsListView: React.FC<React.PropsWithChildren<PipelineRunsListViewProps>> = ({
  applicationName,
  componentName,
  customFilter,
}) => {
  const { namespace, workspace } = useWorkspaceInfo();
  const [components, componentsLoaded] = useComponents(namespace, workspace, applicationName);
  const [nameFilter, setNameFilter] = useSearchParam('name', '');
  const [statusFilterExpanded, setStatusFilterExpanded] = React.useState<boolean>(false);
  const [statusFiltersParam, setStatusFiltersParam] = useSearchParam('status', '');
  const [typeFilterExpanded, setTypeFilterExpanded] = React.useState<boolean>(false);
  const [typeFiltersParam, setTypeFiltersParam] = useSearchParam('type', '');
  const [onLoadName, setOnLoadName] = React.useState(nameFilter);
  React.useEffect(() => {
    if (nameFilter) {
      setOnLoadName(nameFilter);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [pipelineRuns, loaded, error, getNextPage, { isFetchingNextPage, hasNextPage }] =
    usePipelineRuns(
      componentsLoaded ? namespace : null,
      workspace,
      React.useMemo(
        () => ({
          selector: {
            matchLabels: {
              [PipelineRunLabel.APPLICATION]: applicationName,
            },
            ...(!onLoadName && {
              matchExpressions: [
                {
                  key: `${PipelineRunLabel.COMPONENT}`,
                  operator: 'In',
                  values: componentName
                    ? [componentName]
                    : components?.map((c) => c.metadata?.name),
                },
              ],
            }),
            ...(onLoadName && { filterByName: onLoadName.trim().toLowerCase() }),
          },
        }),
        [applicationName, componentName, components, onLoadName],
      ),
    );
  const statusFilters = React.useMemo(
    () => (statusFiltersParam ? statusFiltersParam.split(',') : []),
    [statusFiltersParam],
  );

  const setStatusFilters = React.useCallback(
    (filters: string[]) => setStatusFiltersParam(filters.join(',')),
    [setStatusFiltersParam],
  );

  const statusFilterObj = React.useMemo(() => {
    return pipelineRuns.reduce((acc, plr) => {
      if (customFilter && !customFilter(plr)) {
        return acc;
      }

      const stat = pipelineRunStatus(plr);
      if (statuses.includes(stat)) {
        if (acc[stat] !== undefined) {
          acc[stat] = acc[stat] + 1;
        } else {
          acc[stat] = 1;
        }
      }
      return acc;
    }, {});
  }, [pipelineRuns, customFilter]);

  const typeFilters = React.useMemo(
    () => (typeFiltersParam ? typeFiltersParam.split(',') : []),
    [typeFiltersParam],
  );

  const setTypeFilters = (filters: string[]) => setTypeFiltersParam(filters.join(','));

  const typeFilterObj = React.useMemo(() => {
    return pipelineRuns.reduce((acc, plr) => {
      if (customFilter && !customFilter(plr)) {
        return acc;
      }

      const runType = plr?.metadata.labels[PipelineRunLabel.PIPELINE_TYPE];

      if (pipelineRunTypes.includes(runType)) {
        if (acc[runType] !== undefined) {
          acc[runType] = acc[runType] + 1;
        } else {
          acc[runType] = 1;
        }
      }
      return acc;
    }, {});
  }, [pipelineRuns, customFilter]);

  const filteredPLRs = React.useMemo(
    () =>
      pipelineRuns
        .filter((plr) => {
          const runType = plr?.metadata.labels[PipelineRunLabel.PIPELINE_TYPE];
          return (
            (!nameFilter ||
              plr.metadata.name.indexOf(nameFilter) >= 0 ||
              plr.metadata.labels?.[PipelineRunLabel.COMPONENT]?.indexOf(
                nameFilter.trim().toLowerCase(),
              ) >= 0) &&
            (!statusFilters.length || statusFilters.includes(pipelineRunStatus(plr))) &&
            (!typeFilters.length || typeFilters.includes(runType))
          );
        })
        .filter((plr) => !customFilter || customFilter(plr)),
    [customFilter, nameFilter, pipelineRuns, statusFilters, typeFilters],
  );

  const vulnerabilities = usePLRVulnerabilities(nameFilter ? filteredPLRs : pipelineRuns);

  const onClearFilters = () => {
    onLoadName.length && setOnLoadName('');
    setNameFilter('');
    setStatusFilters([]);
    setTypeFilters([]);
  };
  const onNameInput = debounce((n: string) => {
    n.length === 0 && onLoadName.length && setOnLoadName('');

    setNameFilter(n);
  }, 600);

  const EmptyMsg = () => <FilteredEmptyState onClearFilters={onClearFilters} />;
  const NoDataEmptyMsg = () => <PipelineRunEmptyState applicationName={applicationName} />;
  const DataToolbar = (
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
                  {Object.keys(statusFilterObj).map((filter) => (
                    <SelectOption
                      key={filter}
                      value={filter}
                      isChecked={statusFilters.includes(filter)}
                      itemCount={statusFilterObj[filter] ?? 0}
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
                  {Object.keys(typeFilterObj).map((filter) => (
                    <SelectOption
                      key={filter}
                      value={filter}
                      isChecked={typeFilters.includes(filter)}
                      itemCount={typeFilterObj[filter] ?? 0}
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

  if (error) {
    const httpError = HttpError.fromCode(error ? (error as { code: number }).code : 404);
    return (
      <ErrorEmptyState
        httpError={httpError}
        title="Unable to load pipeline runs"
        body={httpError?.message.length ? httpError?.message : 'Something went wrong'}
      />
    );
  }
  return (
    <div>
      <Table
        data={filteredPLRs}
        unfilteredData={pipelineRuns}
        NoDataEmptyMsg={NoDataEmptyMsg}
        EmptyMsg={EmptyMsg}
        Toolbar={DataToolbar}
        aria-label="Pipeline run List"
        customData={vulnerabilities}
        Header={PipelineRunListHeaderWithVulnerabilities}
        Row={PipelineRunListRowWithVulnerabilities}
        loaded={isFetchingNextPage || loaded}
        getRowProps={(obj: PipelineRunKind) => ({
          id: obj.metadata.name,
        })}
        isInfiniteLoading
        infiniteLoaderProps={{
          isRowLoaded: (args) => {
            return !!filteredPLRs[args.index];
          },
          loadMoreRows: () => {
            hasNextPage && !isFetchingNextPage && getNextPage?.();
          },
          rowCount: hasNextPage ? filteredPLRs.length + 1 : filteredPLRs.length,
        }}
      />
      {isFetchingNextPage ? (
        <Stack style={{ marginTop: 'var(--pf-v5-global--spacer--md)' }} hasGutter>
          <Bullseye>
            <Spinner size="lg" aria-label="Loading more pipeline runs" />
          </Bullseye>
        </Stack>
      ) : null}
    </div>
  );
};

export default PipelineRunsListView;
