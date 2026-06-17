import * as React from 'react';
import { Bullseye, EmptyState, EmptyStateBody, Spinner } from '@patternfly/react-core';
import { ChatContextTarget, withChatContextRowPropsIfEnabled } from '~/components/AIChat';
import { useIsOnFeatureFlag } from '~/feature-flags/hooks';
import { useTaskRunsForPipelineRuns } from '~/hooks/useTaskRunsV2';
import { textMatch } from '~/utils/text-filter-utils';
import { Table, useDeepCompareMemoize } from '../../shared';
import FilteredEmptyState from '../../shared/components/empty-state/FilteredEmptyState';
import { getErrorState } from '../../shared/utils/error-utils';
import { TaskRunKind } from '../../types';
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
  const isChatEnabled = useIsOnFeatureFlag('ai-chat');
  const tableContextId = `pipeline-run-task-runs-${pipelineRunName}`;
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
      taskRuns.filter(
        (taskrun) =>
          textMatch(taskrun.metadata.name, nameFilter) ||
          textMatch(taskrun.spec?.taskRef?.name, nameFilter),
      ),
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
        <ChatContextTarget
          id={tableContextId}
          label="Task runs table"
          description="Task runs for this pipeline run"
        >
          <Table
            data={filteredTaskRun}
            aria-label="TaskRun List"
            Header={TaskRunListHeader}
            Row={TaskRunListRow}
            loaded={loaded}
            getRowProps={(obj: TaskRunKind) =>
              withChatContextRowPropsIfEnabled(
                isChatEnabled,
                { id: obj.metadata.uid },
                {
                  id: `task-run-row-${pipelineRunName}-${obj.metadata.name}`,
                  label: obj.metadata.name,
                  description: 'Task run table row',
                  parentContextId: tableContextId,
                },
              )
            }
          />
        </ChatContextTarget>
      ) : (
        <FilteredEmptyState onClearFilters={() => onClearFilters()} />
      )}
    </>
  );
};

export default TaskRunListView;
