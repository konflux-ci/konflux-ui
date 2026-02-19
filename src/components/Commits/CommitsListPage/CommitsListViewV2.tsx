import * as React from 'react';
import { Bullseye, Flex, Spinner } from '@patternfly/react-core';
import { SortByDirection } from '@patternfly/react-table';
import { FilterContext } from '~/components/Filter/generic/FilterContext';
import { MultiSelect } from '~/components/Filter/generic/MultiSelect';
import { BaseTextFilterToolbar } from '~/components/Filter/toolbars/BaseTextFIlterToolbar';
import { createFilterObj } from '~/components/Filter/utils/filter-utils';
import ColumnManagement from '~/shared/components/table/ColumnManagement';
import { getErrorState } from '~/shared/utils/error-utils';
import { SESSION_STORAGE_KEYS } from '../../../consts/constants';
import {
  PipelineRunLabel,
  PipelineRunType,
  RUN_STATUS_PRIORITY,
  runStatus,
} from '../../../consts/pipelinerun';
import { useComponent } from '../../../hooks/useComponents';
import { usePipelineRunsV2 } from '../../../hooks/usePipelineRunsV2';
import { useSortedResources } from '../../../hooks/useSortedResources';
import { useVisibleColumns } from '../../../hooks/useVisibleColumns';
import { Table, useDeepCompareMemoize } from '../../../shared';
import FilteredEmptyState from '../../../shared/components/empty-state/FilteredEmptyState';
import { useNamespace } from '../../../shared/providers/Namespace';
import { Commit, PipelineRunKind } from '../../../types';
import { getCommitsFromPLRs, getCommitSha, statuses } from '../../../utils/commits-utils';
import { getCommitStatusFromPipelineRuns } from '../commit-status';
import CommitsEmptyStateV2 from '../CommitsEmptyStateV2';
import {
  CommitColumnKeys,
  COMMIT_COLUMNS_DEFINITIONS,
  DEFAULT_VISIBLE_COMMIT_COLUMNS,
  NON_HIDABLE_COMMIT_COLUMNS,
  SortableHeaders,
} from './commits-columns-config';
import { getCommitsListHeaderWithColumns } from './CommitsListHeader';
import CommitsListRow from './CommitsListRow';

interface CommitsListViewPropsV2 {
  componentName: string;
  versionName?: string;
}

const CommitsListViewV2: React.FC<React.PropsWithChildren<CommitsListViewPropsV2>> = ({
  componentName,
  versionName,
}) => {
  const namespace = useNamespace();
  const [component, compLoaded, compError] = useComponent(namespace, componentName, true);
  const { filters: unparsedFilters, setFilters, onClearFilters } = React.useContext(FilterContext);

  const [visibleColumns, setVisibleColumns] = useVisibleColumns(
    SESSION_STORAGE_KEYS.COMMITS_VISIBLE_COLUMNS,
    DEFAULT_VISIBLE_COMMIT_COLUMNS,
  );
  const [isColumnManagementOpen, setIsColumnManagementOpen] = React.useState(false);

  const sortPaths: Record<SortableHeaders, string> = {
    [SortableHeaders.name]: 'shaTitle',
    [SortableHeaders.branch]: 'branch',
    [SortableHeaders.byUser]: 'user',
    [SortableHeaders.committedAt]: 'creationTime',
    [SortableHeaders.status]: '', // Status column uses custom priority-based sorting
  };

  const [activeSortIndex, setActiveSortIndex] = React.useState<number>(SortableHeaders.committedAt);
  const [activeSortDirection, setActiveSortDirection] = React.useState<SortByDirection>(
    SortByDirection.desc,
  );
  const filters = useDeepCompareMemoize({
    name: unparsedFilters.name ? (unparsedFilters.name as string) : '',
    status: unparsedFilters.status ? (unparsedFilters.status as string[]) : [],
    version: unparsedFilters.version ? (unparsedFilters.version as string[]) : [],
  });

  const { name: nameFilter, status: statusFilter, version: versionFilter } = filters;

  const [pipelineRuns, plrLoaded, plrError, getNextPage, { isFetchingNextPage, hasNextPage }] =
    usePipelineRunsV2(
      compLoaded && !compError ? namespace : null,
      React.useMemo(
        () => ({
          selector: {
            filterByCreationTimestampAfter: component?.metadata?.creationTimestamp,
            matchLabels: {
              [PipelineRunLabel.COMPONENT]: componentName,
              ...(versionName ? { [PipelineRunLabel.COMPONENT_VERSION]: versionName } : {}),
            },
          },
        }),
        [component?.metadata?.creationTimestamp, componentName, versionName],
      ),
    );

  // filter to only BUILD type PLRs for the list display
  const buildPipelineRuns = React.useMemo(() => {
    return (
      pipelineRuns?.filter(
        (plr) => plr.metadata?.labels?.[PipelineRunLabel.PIPELINE_TYPE] === PipelineRunType.BUILD,
      ) || []
    );
  }, [pipelineRuns]);

  const allVersions = React.useMemo(
    () => component?.spec?.source?.versions ?? [],
    [component?.spec?.source?.versions],
  );
  const allVersionBranches = React.useMemo(() => allVersions.map((v) => v.revision), [allVersions]);

  const versionLabelMap = React.useMemo(
    () => Object.fromEntries(allVersions.map((v) => [v.revision, v.name])),
    [allVersions],
  );

  // used in CommitListRow to calculate the correct latest PLR status
  const allPipelineRunsFilteredByVersions = React.useMemo(
    () =>
      pipelineRuns?.filter((plr) =>
        allVersionBranches.includes(plr.metadata?.labels?.[PipelineRunLabel.COMPONENT_VERSION]),
      ),
    [allVersionBranches, pipelineRuns],
  );

  const commits = React.useMemo(
    () => (plrLoaded && buildPipelineRuns && getCommitsFromPLRs(buildPipelineRuns)) || [],
    [plrLoaded, buildPipelineRuns],
  );

  const commitPipelineRunMap = React.useMemo<Record<string, PipelineRunKind[]>>(
    () =>
      allPipelineRunsFilteredByVersions.reduce(
        (acc, plr) => {
          const sha = getCommitSha(plr);
          if (sha) {
            if (!acc[sha]) {
              acc[sha] = [];
            }
            acc[sha].push(plr);
          }
          return acc;
        },
        {} as Record<string, PipelineRunKind[]>,
      ),
    [allPipelineRunsFilteredByVersions],
  );

  const commitStatusMap = React.useMemo<Record<string, runStatus>>(
    () =>
      Object.entries(commitPipelineRunMap).reduce(
        (acc, [sha, commitPipelineRuns]) => {
          acc[sha] = getCommitStatusFromPipelineRuns(commitPipelineRuns);
          return acc;
        },
        {} as Record<string, runStatus>,
      ),
    [commitPipelineRunMap],
  );

  const statusFilterObj = React.useMemo(
    () => createFilterObj(commits, (c) => commitStatusMap[c.sha] || runStatus.Unknown, statuses),
    [commits, commitStatusMap],
  );

  // TODO: temporary until item count is not removed from MultiSelect
  const versionFilterObj = Object.fromEntries(allVersionBranches.map((b) => [b, 0]));

  const filteredCommits = React.useMemo(
    () =>
      commits.filter((commit) => {
        const commitStatus = commitStatusMap[commit.sha] || runStatus.Unknown;
        return (
          (!nameFilter ||
            commit.sha.indexOf(nameFilter) !== -1 ||
            commit.components.some(
              (c) => c.toLowerCase().indexOf(nameFilter.trim().toLowerCase()) !== -1,
            ) ||
            commit.pullRequestNumber
              .toLowerCase()
              .indexOf(nameFilter.trim().replace('#', '').toLowerCase()) !== -1 ||
            commit.shaTitle.toLowerCase().includes(nameFilter.trim().toLowerCase())) &&
          (!statusFilter.length || statusFilter.includes(commitStatus)) &&
          (!versionFilter.length || versionFilter.includes(commit.branch))
        );
      }),
    [commits, nameFilter, statusFilter, versionFilter, commitStatusMap],
  );

  // Default sorted commits using useSortedResources for standard columns
  const defaultSortedCommits = useSortedResources(
    filteredCommits,
    activeSortIndex,
    activeSortDirection,
    sortPaths,
  );

  // Apply custom sorting for status column, use default sorting for other columns
  const sortedCommits = React.useMemo(() => {
    if (activeSortIndex === SortableHeaders.status) {
      const dir = activeSortDirection === SortByDirection.asc ? 1 : -1;
      return [...filteredCommits].sort((a, b) => {
        const aVal =
          RUN_STATUS_PRIORITY[commitStatusMap[a.sha]] ?? RUN_STATUS_PRIORITY[runStatus.Unknown];
        const bVal =
          RUN_STATUS_PRIORITY[commitStatusMap[b.sha]] ?? RUN_STATUS_PRIORITY[runStatus.Unknown];
        return (aVal - bVal) * dir;
      });
    }
    return defaultSortedCommits;
  }, [
    filteredCommits,
    activeSortIndex,
    activeSortDirection,
    defaultSortedCommits,
    commitStatusMap,
  ]);

  const NoDataEmptyMessage = () => <CommitsEmptyStateV2 />;
  const EmptyMessage = () => <FilteredEmptyState onClearFilters={() => onClearFilters()} />;

  const DataToolbar = (
    <BaseTextFilterToolbar
      text={nameFilter}
      label="name"
      setText={(name) => setFilters({ ...filters, name })}
      onClearFilters={onClearFilters}
      data-test="commit-list-toolbar"
      totalColumns={COMMIT_COLUMNS_DEFINITIONS.length}
      openColumnManagement={() => setIsColumnManagementOpen(true)}
    >
      <MultiSelect
        label="Status"
        filterKey="status"
        values={statusFilter}
        setValues={(newFilters) => setFilters({ ...filters, status: newFilters })}
        options={statusFilterObj}
      />
      {!versionName && (
        <MultiSelect
          label="Version"
          filterKey="version"
          values={versionFilter}
          setValues={(newFilters) => setFilters({ ...filters, version: newFilters })}
          options={versionFilterObj}
          optionLabels={versionLabelMap}
        />
      )}
    </BaseTextFilterToolbar>
  );

  // Automatically fetch the next page of pipeline runs when:
  // - Initial data is loaded
  // - Current page is empty
  // - More pages are available
  // - Not currently fetching the next page
  // This prevents showing the empty state message while more data is being loaded
  React.useEffect(() => {
    if (
      plrLoaded &&
      buildPipelineRuns?.length === 0 &&
      hasNextPage &&
      !isFetchingNextPage &&
      getNextPage
    ) {
      getNextPage();
    }
  }, [getNextPage, hasNextPage, isFetchingNextPage, plrLoaded, buildPipelineRuns]);

  const CommitsListHeaderWithSorting = React.useMemo(
    () =>
      getCommitsListHeaderWithColumns(
        visibleColumns,
        activeSortIndex,
        activeSortDirection,
        (_, index, direction) => {
          setActiveSortIndex(index);
          setActiveSortDirection(direction);
        },
      ),
    [visibleColumns, activeSortIndex, activeSortDirection],
  );

  const error = compError ?? plrError;
  if (error) {
    return getErrorState(error, plrLoaded, 'commits');
  }

  const isFiltered =
    nameFilter.length > 0 || statusFilter.length > 0 || (!versionName && versionFilter.length > 0);

  return (
    <Flex direction={{ default: 'column' }}>
      {(isFiltered || commits.length > 0) && DataToolbar}
      <Table
        virtualize
        data={sortedCommits}
        unfilteredData={commits}
        EmptyMsg={isFiltered ? EmptyMessage : NoDataEmptyMessage}
        NoDataEmptyMsg={NoDataEmptyMessage}
        Toolbar={DataToolbar}
        aria-label="Commit List"
        Header={CommitsListHeaderWithSorting}
        Row={(props) => {
          const commit = props.obj as Commit;
          return (
            <CommitsListRow
              obj={props.obj as Commit}
              visibleColumns={visibleColumns}
              status={commitStatusMap[commit.sha] || runStatus.Unknown}
            />
          );
        }}
        loaded={plrLoaded && !(hasNextPage && buildPipelineRuns?.length === 0)}
        getRowProps={(obj: Commit) => ({
          id: obj.sha,
        })}
        onRowsRendered={({ stopIndex }) => {
          if (
            plrLoaded &&
            stopIndex === sortedCommits.length - 1 &&
            hasNextPage &&
            !isFetchingNextPage
          ) {
            getNextPage?.();
          }
        }}
      />
      <ColumnManagement<CommitColumnKeys>
        isOpen={isColumnManagementOpen}
        onClose={() => setIsColumnManagementOpen(false)}
        visibleColumns={visibleColumns}
        onVisibleColumnsChange={setVisibleColumns}
        columns={COMMIT_COLUMNS_DEFINITIONS}
        defaultVisibleColumns={DEFAULT_VISIBLE_COMMIT_COLUMNS}
        nonHidableColumns={NON_HIDABLE_COMMIT_COLUMNS}
        title="Manage commit columns"
        description="Selected columns will be displayed in the commits table."
      />
      {isFetchingNextPage ? (
        <div
          style={{
            marginTop: 'var(--pf-v5-global--spacer--2xl)',
            marginBottom: 'var(--pf-v5-global--spacer--2xl)',
          }}
        >
          <Bullseye>
            <Spinner
              size="lg"
              aria-label="Loading more commits"
              data-test="commits-list-next-page-loading-spinner"
            />
          </Bullseye>
        </div>
      ) : null}
    </Flex>
  );
};

export default CommitsListViewV2;
