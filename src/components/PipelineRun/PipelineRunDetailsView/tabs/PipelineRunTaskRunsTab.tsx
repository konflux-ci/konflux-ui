import * as React from 'react';
import { useParams } from 'react-router-dom';
import { FilterContextProvider } from '~/components/Filter/generic/FilterContext';
import { useNamespace } from '~/shared/providers/Namespace';
import { getErrorState } from '~/shared/utils/error-utils';
import { useTaskRuns } from '../../../../hooks/useTaskRuns';
import { RouterParams } from '../../../../routes/utils';
import TaskRunListView from '../../../TaskRunListView/TaskRunListView';

const PipelineRunTaskRunsTab: React.FC = () => {
  const { pipelineRunName } = useParams<RouterParams>();
  const namespace = useNamespace();
  const [taskRuns, taskRunsLoaded, taskRunError] = useTaskRuns(namespace, pipelineRunName);

  if (taskRunError) {
    return getErrorState(taskRunError, taskRunsLoaded, 'task runs');
  }

  return (
    <FilterContextProvider filterParams={['name']}>
      <TaskRunListView taskRuns={taskRuns} loaded={taskRunsLoaded} />
    </FilterContextProvider>
  );
};

export default PipelineRunTaskRunsTab;
