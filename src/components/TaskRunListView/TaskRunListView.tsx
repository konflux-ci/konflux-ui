import * as React from 'react';
import { Bullseye, EmptyState, EmptyStateBody, Spinner } from '@patternfly/react-core';
import { Table, useDeepCompareMemoize } from '../../shared';
import FilteredEmptyState from '../../shared/components/empty-state/FilteredEmptyState';
import { TaskRunKind } from '../../types';
import { FilterContext } from '../Filter/generic/FilterContext';
import { BaseTextFilterToolbar } from '../Filter/toolbars/BaseTextFIlterToolbar';
import { TaskRunListHeader } from './TaskRunListHeader';
import TaskRunListRow from './TaskRunListRow';

type Props = { taskRuns: TaskRunKind[]; loaded: boolean };

const TaskRunListView: React.FC<React.PropsWithChildren<Props>> = ({ taskRuns, loaded }) => {
  const { filters: unparsedFilters, setFilters, onClearFilters } = React.useContext(FilterContext);
  const filters = useDeepCompareMemoize({
    name: unparsedFilters.name ? (unparsedFilters.name as string) : '',
  });
  const { name: nameFilter } = filters;

  const sortedTaskRuns = React.useMemo(
    () =>
      taskRuns?.sort(
        (a, b) => +new Date(a.metadata.creationTimestamp) - +new Date(b.metadata.creationTimestamp),
      ),
    [taskRuns],
  );

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
