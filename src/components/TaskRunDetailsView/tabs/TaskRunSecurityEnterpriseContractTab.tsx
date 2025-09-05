import * as React from 'react';
import { useParams } from 'react-router-dom';
import { Bullseye, Spinner } from '@patternfly/react-core';
import { FilterContextProvider } from '~/components/Filter/generic/FilterContext';
import { useTaskRunV2 } from '../../../hooks/usePipelineRuns';
import { RouterParams } from '../../../routes/utils';
import { useNamespace } from '../../../shared/providers/Namespace';
import { TektonResourceLabel } from '../../../types';
import { SecurityEnterpriseContractTab } from '../../EnterpriseContract/SecurityEnterpriseContractTab';

export const TaskrunSecurityEnterpriseContractTab: React.FC = () => {
  const { taskRunName } = useParams<RouterParams>();
  const namespace = useNamespace();
  const [taskRun, loaded] = useTaskRunV2(namespace, taskRunName);
  const plrName = taskRun?.metadata?.labels?.[TektonResourceLabel.pipelinerun];

  if (!loaded) {
    return (
      <Bullseye>
        <Spinner size="lg" />
      </Bullseye>
    );
  }

  return (
    <FilterContextProvider filterParams={['rule', 'status', 'component']}>
      <SecurityEnterpriseContractTab pipelineRun={plrName} />
    </FilterContextProvider>
  );
};
