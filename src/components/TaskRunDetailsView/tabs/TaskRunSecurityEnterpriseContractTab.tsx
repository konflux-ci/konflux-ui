import * as React from 'react';
import { useParams } from 'react-router-dom';
import { useTaskRun } from '../../../hooks/usePipelineRuns';
import { RouterParams } from '../../../routes/utils';
import { TektonResourceLabel } from '../../../types';
import { SecurityEnterpriseContractTab } from '../../EnterpriseContract/SecurityEnterpriseContractTab';
import { useWorkspaceInfo } from '../../Workspace/workspace-context';

export const TaskrunSecurityEnterpriseContractTab: React.FC = () => {
  const { taskRunName } = useParams<RouterParams>();
  const { namespace } = useWorkspaceInfo();
  const [taskRun] = useTaskRun(namespace, taskRunName);
  const plrName = taskRun.metadata?.labels[TektonResourceLabel.pipelinerun];

  return <SecurityEnterpriseContractTab pipelineRun={plrName} />;
};
