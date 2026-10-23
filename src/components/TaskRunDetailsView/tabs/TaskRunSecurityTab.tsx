import * as React from 'react';
import { useParams } from 'react-router-dom';
import { Bullseye, Spinner } from '@patternfly/react-core';
import { FilterContextProvider } from '~/components/Filter/generic/FilterContext';
import { useTaskRunV2 } from '../../../hooks/useTaskRunsV2';
import { RouterParams } from '../../../routes/utils';
import { useNamespace } from '../../../shared/providers/Namespace';
import { TektonResourceLabel } from '../../../types';
import { SecurityConformaTab } from '../../Conforma/SecurityConformaTab';

export const TaskRunSecurityTab: React.FC = () => {
  const { taskRunName } = useParams<RouterParams>();
  const namespace = useNamespace();
  const [taskRun, loaded] = useTaskRunV2(namespace, taskRunName);
  const plrName =
    taskRun?.metadata?.labels?.[TektonResourceLabel.pipelinerun] ||
    taskRun?.metadata?.ownerReferences?.find((owner) => owner.kind === 'PipelineRun')?.name;

  if (!loaded) {
    return (
      <Bullseye>
        <Spinner size="lg" />
      </Bullseye>
    );
  }

  return (
    <FilterContextProvider filterParams={['rule', 'status', 'component']}>
      <SecurityConformaTab pipelineRunName={plrName} taskRun={taskRun} />
    </FilterContextProvider>
  );
};
