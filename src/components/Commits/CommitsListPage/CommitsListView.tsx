import * as React from 'react';
import { FilterContext } from '~/components/Filter/generic/FilterContext';
import { MultiSelect } from '~/components/Filter/generic/MultiSelect';
import { BaseTextFilterToolbar } from '~/components/Filter/toolbars/BaseTextFIlterToolbar';
import { createFilterObj } from '~/components/Filter/utils/filter-utils';
import ColumnManagement from '~/shared/components/table/ColumnManagement';
import { SESSION_STORAGE_KEYS } from '../../../consts/constants';
import { useBuildPipelines } from '../../../hooks/useBuildPipelines';
import { useVisibleColumns } from '../../../hooks/useVisibleColumns';
import { HttpError } from '../../../k8s/error';
import { Table, useDeepCompareMemoize } from '../../../shared';
import ErrorEmptyState from '../../../shared/components/empty-state/ErrorEmptyState';
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
} from './commits-columns-config';
import { getCommitsListHeaderWithColumns } from './CommitsListHeader';
import CommitsListRow from './CommitsListRow';

interface CommitsListViewProps {
  applicationName?: string;
  componentName?: string;
}

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
  const filters = useDeepCompareMemoize({
    name: unparsedFilters.name ? (unparsedFilters.name as string) : '',
    status: unparsedFilters.status ? (unparsedFilters.status as string[]) : [],
  });

  const { name: nameFilter, status: statusFilter } = filters;

  const [pipelineRuns, loaded, error, getNextPage, { isFetchingNextPage, hasNextPage }] =
    useBuildPipelines(
      namespace,
      applicationName,
      undefined,
      !!componentName,
      componentName ? [componentName] : undefined,
    );

  const commits = React.useMemo(
    () => (loaded && pipelineRuns && getCommitsFromPLRs(pipelineRuns)) || [],
    [loaded, pipelineRuns],
  );

  const statusFilterObj = React.useMemo(
    () => createFilterObj(commits, (c) => pipelineRunStatus(c.pipelineRuns[0]), statuses),
    [commits],
  );

  const filteredCommits = React.useMemo(
    () =>
      commits.filter(
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
    [commits, nameFilter, statusFilter],
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
    <>
      <Table
        virtualize
        data={filteredCommits}
        unfilteredData={commits}
        EmptyMsg={EmptyMessage}
        NoDataEmptyMsg={NoDataEmptyMessage}
        Toolbar={DataToolbar}
        aria-label="Commit List"
        Header={getCommitsListHeaderWithColumns(visibleColumns)}
        Row={(props) => (
          <CommitsListRow obj={props.obj as Commit} visibleColumns={visibleColumns} />
        )}
        loaded={loaded}
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
    </>
  );
};

export default CommitsListView;
