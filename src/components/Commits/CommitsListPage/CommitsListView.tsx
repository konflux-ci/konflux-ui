import * as React from 'react';
import { Bullseye, Spinner } from '@patternfly/react-core';
import { SortByDirection } from '@patternfly/react-table';
import { FilterContext } from '~/components/Filter/generic/FilterContext';
import { MultiSelect } from '~/components/Filter/generic/MultiSelect';
import { BaseTextFilterToolbar } from '~/components/Filter/toolbars/BaseTextFIlterToolbar';
import { createFilterObj } from '~/components/Filter/utils/filter-utils';
import ColumnManagement from '~/shared/components/table/ColumnManagement';
import { getErrorState } from '~/shared/utils/error-utils';
import { SESSION_STORAGE_KEYS } from '../../../consts/constants';
import { PipelineRunLabel, PipelineRunType } from '../../../consts/pipelinerun';
import { useApplication } from '../../../hooks/useApplications';
import { useComponents } from '../../../hooks/useComponents';
import { usePipelineRunsV2 } from '../../../hooks/usePipelineRunsV2';
import { useVisibleColumns } from '../../../hooks/useVisibleColumns';
import { Table, useDeepCompareMemoize } from '../../../shared';
import FilteredEmptyState from '../../../shared/components/empty-state/FilteredEmptyState';
import { useNamespace } from '../../../shared/providers/Namespace';
import { Commit } from '../../../types';
import { getCommitsFromPLRs, statuses } from '../../../utils/commits-utils';
import { pipelineRunStatus } from '../../../utils/pipeline-utils';
import CommitsEmptyState from '../CommitsEmptyState';
import {
  CommitColumnKeys,
  COMMIT_COLUMNS_DEFINITIONS,
  DEFAULT_VISIBLE_COMMIT_COLUMNS,
  NON_HIDABLE_COMMIT_COLUMNS,
  COMMIT_COLUMN_ORDER,
} from './commits-columns-config';
import { getCommitsListHeaderWithColumns } from './CommitsListHeader';
import CommitsListRow from './CommitsListRow';

interface CommitsListViewProps {
  applicationName?: string;
  componentName?: string;
}

const getCommitSortFunction = (columnKey: CommitColumnKeys, direction: SortByDirection) => {
  const getValue = (commit: Commit) => {
    switch (columnKey) {
      case 'name':
        return commit.shaTitle || commit.sha;
      case 'branch':
        return commit.branch || '';
      case 'component':
        return commit.components.join(', ');
      case 'byUser':
        return commit.user || '';
      case 'committedAt':
        return commit.pipelineRuns?.[0]?.metadata?.creationTimestamp || '';
      case 'status':
        return pipelineRunStatus(commit.pipelineRuns?.[0]) || '';
      default:
        return '';
    }
  };

  return (a: Commit, b: Commit) => {
    const comparison = String(getValue(a)).localeCompare(String(getValue(b)));
    return direction === SortByDirection.asc ? comparison : -comparison;
  };
};

const CommitsListView: React.FC<React.PropsWithChildren<CommitsListViewProps>> = ({
  applicationName,
  componentName,
}) => {
  const namespace = useNamespace();
  const { filters: unparsedFilters, setFilters, onClearFilters } = React.useContext(FilterContext);

  const [visibleColumns, setVisibleColumns] = useVisibleColumns(
    SESSION_STORAGE_KEYS.COMMITS_VISIBLE_COLUMNS,
    DEFAULT_VISIBLE_COMMIT_COLUMNS,
  );
  const [isColumnManagementOpen, setIsColumnManagementOpen] = React.useState(false);
  const [activeSortIndex, setActiveSortIndex] = React.useState(0);
  const [activeSortDirection, setActiveSortDirection] = React.useState(SortByDirection.desc);
  const filters = useDeepCompareMemoize({
    name: unparsedFilters.name ? (unparsedFilters.name as string) : '',
    status: unparsedFilters.status ? (unparsedFilters.status as string[]) : [],
  });

  const { name: nameFilter, status: statusFilter } = filters;

  const [application, applicationLoaded] = useApplication(namespace, applicationName);
  const [pipelineRuns, loaded, error, getNextPage, { isFetchingNextPage, hasNextPage }] =
    usePipelineRunsV2(
      applicationLoaded ? namespace : null,
      React.useMemo(
        () => ({
          selector: {
            filterByCreationTimestampAfter: application?.metadata?.creationTimestamp,
            matchLabels: {
              [PipelineRunLabel.APPLICATION]: applicationName,
              ...(componentName ? { [PipelineRunLabel.COMPONENT]: componentName } : {}),
            },
          },
        }),
        [application?.metadata?.creationTimestamp, applicationName, componentName],
      ),
    );

  // filter to only BUILD type PLRs for the list display
  const buildPipelineRuns = React.useMemo(() => {
    return (
      pipelineRuns
        ?.filter((plr) =>
          componentName
            ? componentName === plr.metadata?.labels?.[PipelineRunLabel.COMPONENT]
            : true,
        )
        ?.filter(
          (plr) => plr.metadata?.labels?.[PipelineRunLabel.PIPELINE_TYPE] === PipelineRunType.BUILD,
        ) || []
    );
  }, [componentName, pipelineRuns]);

  const [components, componentsLoaded, componentsError] = useComponents(namespace, applicationName);
  const componentNames = React.useMemo(
    () => (componentsLoaded && !componentsError ? components.map((c) => c.metadata?.name) : []),
    [components, componentsLoaded, componentsError],
  );

  // used in CommitListRow to calculate the correct latest PLR status
  const allPipelineRunsFilteredByComponents = React.useMemo(
    () =>
      pipelineRuns?.filter((plr) =>
        componentNames.includes(plr.metadata?.labels?.[PipelineRunLabel.COMPONENT]),
      ),
    [componentNames, pipelineRuns],
  );

  const commits = React.useMemo(
    () => (loaded && buildPipelineRuns && getCommitsFromPLRs(buildPipelineRuns)) || [],
    [loaded, buildPipelineRuns],
  );

  const sortedCommits = React.useMemo(() => {
    if (!commits.length) return commits;

    const sortColumnKey = COMMIT_COLUMN_ORDER.filter((col) => visibleColumns.has(col))[
      activeSortIndex
    ];
    if (!sortColumnKey) return commits;

    return [...commits].sort(getCommitSortFunction(sortColumnKey, activeSortDirection));
  }, [commits, activeSortIndex, activeSortDirection, visibleColumns]);

  const statusFilterObj = React.useMemo(
    () => createFilterObj(sortedCommits, (c) => pipelineRunStatus(c.pipelineRuns[0]), statuses),
    [sortedCommits],
  );

  const filteredCommits = React.useMemo(
    () =>
      sortedCommits.filter(
        (commit) =>
          (!nameFilter ||
            commit.sha.indexOf(nameFilter) !== -1 ||
            commit.components.some(
              (c) => c.toLowerCase().indexOf(nameFilter.trim().toLowerCase()) !== -1,
            ) ||
            commit.pullRequestNumber
              .toLowerCase()
              .indexOf(nameFilter.trim().replace('#', '').toLowerCase()) !== -1 ||
            commit.shaTitle.toLowerCase().includes(nameFilter.trim().toLowerCase())) &&
          (!statusFilter.length ||
            statusFilter.includes(pipelineRunStatus(commit.pipelineRuns[0]))),
      ),
    [sortedCommits, nameFilter, statusFilter],
  );

  const NoDataEmptyMessage = () => <CommitsEmptyState applicationName={applicationName} />;
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
    </BaseTextFilterToolbar>
  );

  React.useEffect(() => {
    if (
      loaded &&
      buildPipelineRuns?.length === 0 &&
      hasNextPage &&
      !isFetchingNextPage &&
      getNextPage
    ) {
      getNextPage();
    }
  }, [getNextPage, hasNextPage, isFetchingNextPage, loaded, buildPipelineRuns]);

  if (error) {
    return getErrorState(error, loaded, 'commits');
  }

  return (
    <>
      <Table
        virtualize
        data={filteredCommits}
        unfilteredData={sortedCommits}
        EmptyMsg={EmptyMessage}
        NoDataEmptyMsg={NoDataEmptyMessage}
        Toolbar={DataToolbar}
        aria-label="Commit List"
        Header={getCommitsListHeaderWithColumns(
          visibleColumns,
          activeSortIndex,
          activeSortDirection,
          (_, index, direction) => {
            setActiveSortIndex(index);
            setActiveSortDirection(direction);
          },
        )}
        Row={(props) => (
          <CommitsListRow
            obj={props.obj as Commit}
            visibleColumns={visibleColumns}
            pipelineRuns={allPipelineRunsFilteredByComponents}
          />
        )}
        loaded={loaded && !(hasNextPage && buildPipelineRuns?.length === 0)}
        getRowProps={(obj: Commit) => ({
          id: obj.sha,
        })}
        onRowsRendered={({ stopIndex }) => {
          if (
            loaded &&
            stopIndex === filteredCommits.length - 1 &&
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
    </>
  );
};

export default CommitsListView;
