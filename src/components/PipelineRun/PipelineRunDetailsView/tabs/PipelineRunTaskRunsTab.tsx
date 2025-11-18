import * as React from 'react';
import { useParams } from 'react-router-dom';
import { Bullseye, Spinner } from '@patternfly/react-core';
import { FilterContextProvider } from '~/components/Filter/generic/FilterContext';
import { usePipelineRunV2 } from '~/hooks/usePipelineRunsV2';
import { useNamespace } from '~/shared/providers/Namespace';
import { RouterParams } from '../../../../routes/utils';
import TaskRunListView from '../../../TaskRunListView/TaskRunListView';

const PipelineRunTaskRunsTab: React.FC = () => {
  const { pipelineRunName } = useParams<RouterParams>();
  const namespace = useNamespace();
  const [pipelineRun, loaded] = usePipelineRunV2(namespace, pipelineRunName);

  if (!loaded) {
    return (
      <Bullseye>
        <Spinner />
      </Bullseye>
    );
  }

  return (
    <FilterContextProvider filterParams={['name']}>
      <TaskRunListView
        namespace={namespace}
        pipelineRunName={pipelineRunName}
        pipelineRunCreationTimestamp={pipelineRun?.metadata?.creationTimestamp}
      />
    </FilterContextProvider>
  );
};

export default PipelineRunTaskRunsTab;
