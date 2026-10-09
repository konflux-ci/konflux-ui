import { useParams } from 'react-router-dom';
import { FilterContextProvider } from '~/components/Filter/generic/FilterContext';
import TaskRunListView from '~/components/TaskRunListView/TaskRunListView';
import { usePipelineRunV2 } from '~/hooks/usePipelineRunsV2';
import { useNamespace } from '~/shared/providers/Namespace';

const NamespacePipelineRunTaskRunsTab = () => {
  const { pipelineRunName } = useParams();
  const namespace = useNamespace();
  const [pipelineRun] = usePipelineRunV2(namespace, pipelineRunName);
  return (
    <FilterContextProvider filterParams={['name']}>
      <TaskRunListView
        namespace={namespace}
        pipelineRunName={pipelineRunName}
        pipelineRun={pipelineRun}
      />
    </FilterContextProvider>
  );
};

export default NamespacePipelineRunTaskRunsTab;
