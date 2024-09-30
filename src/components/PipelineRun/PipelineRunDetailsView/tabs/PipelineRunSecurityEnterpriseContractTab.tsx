import * as React from 'react';
import { useParams } from 'react-router-dom';
import { RouterParams } from '../../../../routes/utils';
import { SecurityEnterpriseContractTab } from '../../../EnterpriseContract/SecurityEnterpriseContractTab';

export const PipelineRunSecurityEnterpriseContractTab: React.FC = () => {
  const { pipelineRunName } = useParams<RouterParams>();

  return <SecurityEnterpriseContractTab pipelineRun={pipelineRunName} />;
};
