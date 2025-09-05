import * as React from 'react';
import { Bullseye, EmptyState, EmptyStateBody, Spinner } from '@patternfly/react-core';
import { TaskRunsOptions, useTaskRunsForPipelineRuns } from '~/hooks/useTaskRuns';
import { Table, useDeepCompareMemoize } from '../../shared';
import ErrorEmptyState from '../../shared/components/empty-state/ErrorEmptyState';
import FilteredEmptyState from '../../shared/components/empty-state/FilteredEmptyState';
import { FilterContext } from '../Filter/generic/FilterContext';
import { BaseTextFilterToolbar } from '../Filter/toolbars/BaseTextFIlterToolbar';
import { TaskRunListHeader } from './TaskRunListHeader';
import TaskRunListRow from './TaskRunListRow';

type Props = {
  namespace: string;
  pipelineRunName: string;
  taskName?: string;
  options?: TaskRunsOptions;
};

const TaskRunListView: React.FC<React.PropsWithChildren<Props>> = ({
  namespace,
  pipelineRunName,
  taskName,
  options,
}) => {
  const { filters: unparsedFilters, setFilters, onClearFilters } = React.useContext(FilterContext);
  const filters = useDeepCompareMemoize({
    name: unparsedFilters.name ? (unparsedFilters.name as string) : '',
  });
  const { name: nameFilter } = filters;

  // Use useTaskRunsForPipelineRuns which handles feature flag switching and sorting
  const [taskRuns, loaded, error] = useTaskRunsForPipelineRuns(
    namespace,
    pipelineRunName,
    taskName,
    options,
  );

  // TaskRuns are already sorted by useTaskRunsV2, no need to re-sort
  const sortedTaskRuns = taskRuns;

  const filteredTaskRun = React.useMemo(
    () =>
      nameFilter
        ? sortedTaskRuns.filter(
            (taskrun) =>
              taskrun.metadata.name.indexOf(nameFilter) !== -1 ||
              (taskrun.spec?.taskRef?.name &&
                taskrun.spec?.taskRef?.name?.indexOf(nameFilter) !== -1),
          )
        : sortedTaskRuns,
    [nameFilter, sortedTaskRuns],
  );

  // Handle error state
  if (error) {
    return (
      <ErrorEmptyState
        title="Unable to load task runs"
        body={(error as { message: string }).message}
      />
    );
  }

  if (!loaded) {
    return (
      <Bullseye>
        <Spinner />
      </Bullseye>
    );
  }

  if (!taskRuns || taskRuns.length === 0) {
    return (
      <EmptyState data-test="taskrun-empty-state">
        <EmptyStateBody>No task runs found</EmptyStateBody>
      </EmptyState>
    );
  }

  return (
    <>
      <BaseTextFilterToolbar
        text={nameFilter}
        label="name"
        setText={(name) => setFilters({ name })}
        onClearFilters={onClearFilters}
        dataTest="taskrun-list-toolbar"
      />
      {filteredTaskRun.length > 0 ? (
        <Table
          data={filteredTaskRun}
          aria-label="TaskRun List"
          Header={TaskRunListHeader}
          Row={TaskRunListRow}
          loaded={loaded}
        />
      ) : (
        <FilteredEmptyState onClearFilters={() => onClearFilters()} />
      )}
    </>
  );
};

export default TaskRunListView;
