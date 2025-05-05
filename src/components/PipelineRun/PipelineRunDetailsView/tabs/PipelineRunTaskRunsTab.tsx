import * as React from 'react';
import { useParams } from 'react-router-dom';
import { FilterContextProvider } from '~/components/Filter/generic/FilterContext';
import { useNamespace } from '~/shared/providers/Namespace';
import { useTaskRuns } from '../../../../hooks/useTaskRuns';
import { HttpError } from '../../../../k8s/error';
import { RouterParams } from '../../../../routes/utils';
import ErrorEmptyState from '../../../../shared/components/empty-state/ErrorEmptyState';
import TaskRunListView from '../../../TaskRunListView/TaskRunListView';

const PipelineRunTaskRunsTab: React.FC = () => {
  const { pipelineRunName } = useParams<RouterParams>();
  const namespace = useNamespace();
  const [taskRuns, taskRunsLoaded, taskRunError] = useTaskRuns(namespace, pipelineRunName);
  if (taskRunError) {
    const httpError = HttpError.fromCode((taskRunError as { code: number }).code);
    return (
      <ErrorEmptyState
        httpError={httpError}
        title={`Unable to load pipeline run ${pipelineRunName}`}
        body={httpError.message}
      />
    );
  }

  return (
    <FilterContextProvider filterParams={['name']}>
      <TaskRunListView taskRuns={taskRuns} loaded={taskRunsLoaded} />
    </FilterContextProvider>
  );
};

export default PipelineRunTaskRunsTab;
