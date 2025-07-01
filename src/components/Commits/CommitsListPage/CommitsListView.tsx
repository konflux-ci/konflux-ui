import * as React from 'react';
import { Bullseye, Spinner } from '@patternfly/react-core';
import { FilterContext } from '~/components/Filter/generic/FilterContext';
import { MultiSelect } from '~/components/Filter/generic/MultiSelect';
import { BaseTextFilterToolbar } from '~/components/Filter/toolbars/BaseTextFIlterToolbar';
import { createFilterObj } from '~/components/Filter/utils/filter-utils';
import { PipelineRunLabel, PipelineRunType } from '../../../consts/pipelinerun';
import { useApplication } from '../../../hooks/useApplications';
import { useComponents } from '../../../hooks/useComponents';
import { usePipelineRuns } from '../../../hooks/usePipelineRuns';
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
  componentName,
}) => {
  const namespace = useNamespace();
  const { filters: unparsedFilters, setFilters, onClearFilters } = React.useContext(FilterContext);
  const filters = useDeepCompareMemoize({
    name: unparsedFilters.name ? (unparsedFilters.name as string) : '',
    status: unparsedFilters.status ? (unparsedFilters.status as string[]) : [],
  });

  const { name: nameFilter, status: statusFilter } = filters;

  const [application, applicationLoaded] = useApplication(namespace, applicationName);
  const [pipelineRuns, loaded, error, getNextPage, { isFetchingNextPage, hasNextPage }] =
    usePipelineRuns(
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

  const [components, componentsLoaded] = useComponents(namespace, applicationName);
  const componentNames = React.useMemo(
    () => (componentsLoaded ? components.map((c) => c.metadata?.name) : []),
    [components, componentsLoaded],
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

  // automatically fetch the next page of pipeline runs when:
  // - Initial data is loaded
  // - Current page is empt
  // - More pages are available
  // - Not currently fetching the next page
  // This prevents showing the empty state message while more data is being loaded
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
        Header={CommitsListHeader}
        Row={(props) => {
          const commit = props.obj as Commit;
          return (
            <CommitsListRow
              {...props}
              obj={{
                commit,
                pipelineRuns: allPipelineRunsFilteredByComponents,
              }}
            />
          );
        }}
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
