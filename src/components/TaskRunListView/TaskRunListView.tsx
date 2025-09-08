import * as React from 'react';
import { Bullseye, EmptyState, EmptyStateBody, Spinner } from '@patternfly/react-core';
import { useTaskRunsForPipelineRuns } from '~/hooks/useTaskRunsV2';
import { Table, useDeepCompareMemoize } from '../../shared';
import FilteredEmptyState from '../../shared/components/empty-state/FilteredEmptyState';
import { getErrorState } from '../../shared/utils/error-utils';
import { FilterContext } from '../Filter/generic/FilterContext';
import { BaseTextFilterToolbar } from '../Filter/toolbars/BaseTextFIlterToolbar';
import { TaskRunListHeader } from './TaskRunListHeader';
import TaskRunListRow from './TaskRunListRow';

type Props = {
  namespace: string;
  pipelineRunName: string;
  taskName?: string;
};

const TaskRunListView: React.FC<React.PropsWithChildren<Props>> = ({
  namespace,
  pipelineRunName,
  taskName,
}) => {
  const { filters: unparsedFilters, setFilters, onClearFilters } = React.useContext(FilterContext);
  const filters = useDeepCompareMemoize({
    name: unparsedFilters.name ? (unparsedFilters.name as string) : '',
  });
  const { name: nameFilter } = filters;

  const [taskRuns, loaded, error] = useTaskRunsForPipelineRuns(
    namespace,
    pipelineRunName,
    taskName,
  );

  // TaskRuns are already sorted by useTaskRunsForPipelineRuns, no need to re-sort
  const filteredTaskRun = React.useMemo(
    () =>
      nameFilter
        ? taskRuns.filter(
            (taskrun) =>
              taskrun.metadata.name.indexOf(nameFilter) !== -1 ||
              (taskrun.spec?.taskRef?.name &&
                taskrun.spec?.taskRef?.name?.indexOf(nameFilter) !== -1),
          )
        : taskRuns,
    [nameFilter, taskRuns],
  );

  // Handle error state
  const errorState = getErrorState(error, loaded, 'task runs');
  if (errorState) {
    return errorState;
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
