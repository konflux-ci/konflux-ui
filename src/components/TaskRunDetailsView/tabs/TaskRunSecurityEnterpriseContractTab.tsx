import * as React from 'react';
import { useParams } from 'react-router-dom';
import { useTaskRun } from '../../../hooks/usePipelineRuns';
import { RouterParams } from '../../../routes/utils';
import { useNamespace } from '../../../shared/providers/Namespace';
import { TektonResourceLabel } from '../../../types';
import { SecurityEnterpriseContractTab } from '../../EnterpriseContract/SecurityEnterpriseContractTab';

export const TaskrunSecurityEnterpriseContractTab: React.FC = () => {
  const { taskRunName } = useParams<RouterParams>();
  const namespace = useNamespace();
  const [taskRun] = useTaskRun(namespace, taskRunName);
  const plrName = taskRun.metadata?.labels[TektonResourceLabel.pipelinerun];

  return <SecurityEnterpriseContractTab pipelineRun={plrName} />;
};
