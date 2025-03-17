import * as React from 'react';
import { FilterContext } from '~/components/Filter/generic/FilterContext';
import { MultiSelect } from '~/components/Filter/generic/MultiSelect';
import { NameFilterToolbar } from '~/components/Filter/toolbars/NameFilterToolbar';
import { createFilterObj } from '~/components/Filter/utils/filter-utils';
import { useBuildPipelines } from '../../../hooks/useBuildPipelines';
import { HttpError } from '../../../k8s/error';
import { Table, useDeepCompareMemoize } from '../../../shared';
import ErrorEmptyState from '../../../shared/components/empty-state/ErrorEmptyState';
import FilteredEmptyState from '../../../shared/components/empty-state/FilteredEmptyState';
import { useNamespace } from '../../../shared/providers/Namespace';
import { Commit } from '../../../types';
import { getCommitsFromPLRs, statuses } from '../../../utils/commits-utils';
import { pipelineRunStatus } from '../../../utils/pipeline-utils';
import CommitsEmptyState from '../CommitsEmptyState';
import CommitsListHeader from './CommitsListHeader';
import CommitsListRow from './CommitsListRow';

interface CommitsListViewProps {
  applicationName?: string;
  componentName?: string;
}

const CommitsListView: React.FC<React.PropsWithChildren<CommitsListViewProps>> = ({
  applicationName,
}) => {
  const namespace = useNamespace();
  const { filters: unparsedFilters, setFilters, onClearFilters } = React.useContext(FilterContext);
  const filters = useDeepCompareMemoize({
    name: unparsedFilters.name ? (unparsedFilters.name as string) : '',
    status: unparsedFilters.status ? (unparsedFilters.status as string[]) : [],
  });

  const { name: nameFilter, status: statusFilter } = filters;

  const [pipelineRuns, loaded, error, getNextPage] = useBuildPipelines(
    namespace,
    applicationName,
    undefined,
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
    <NameFilterToolbar
      name={nameFilter}
      setName={(name) => setFilters({ ...filters, name })}
      onClearFilters={onClearFilters}
      data-test="commit-list-toolbar"
    >
      <MultiSelect
        label="Status"
        filterKey="status"
        values={statusFilter}
        setValues={(newFilters) => setFilters({ ...filters, status: newFilters })}
        options={statusFilterObj}
      />
    </NameFilterToolbar>
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
    <Table
      virtualize
      data={filteredCommits}
      unfilteredData={commits}
      EmptyMsg={EmptyMessage}
      NoDataEmptyMsg={NoDataEmptyMessage}
      Toolbar={DataToolbar}
      aria-label="Commit List"
      Header={CommitsListHeader}
      Row={CommitsListRow}
      loaded={loaded}
      getRowProps={(obj: Commit) => ({
        id: obj.sha,
      })}
      onRowsRendered={({ stopIndex }) => {
        if (loaded && stopIndex === filteredCommits.length - 1) {
          getNextPage?.();
        }
      }}
    />
  );
};

export default CommitsListView;
