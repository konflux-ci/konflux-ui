import * as React from 'react';
import { useParams } from 'react-router-dom';
import { FilterContextProvider } from '~/components/Filter/generic/FilterContext';
import { useNamespace } from '~/shared/providers/Namespace';
import { RouterParams } from '../../../../routes/utils';
import TaskRunListView from '../../../TaskRunListView/TaskRunListView';

const PipelineRunTaskRunsTab: React.FC = () => {
  const { pipelineRunName } = useParams<RouterParams>();
  const namespace = useNamespace();

  return (
    <FilterContextProvider filterParams={['name']}>
      <TaskRunListView namespace={namespace} pipelineRunName={pipelineRunName} />
    </FilterContextProvider>
  );
};

export default PipelineRunTaskRunsTab;
