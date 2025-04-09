import * as React from 'react';
import { useParams } from 'react-router-dom';
import { FilterContextProvider } from '~/components/Filter/generic/FilterContext';
import { RouterParams } from '../../../../routes/utils';
import { SecurityEnterpriseContractTab } from '../../../EnterpriseContract/SecurityEnterpriseContractTab';

export const PipelineRunSecurityEnterpriseContractTab: React.FC = () => {
  const { pipelineRunName } = useParams<RouterParams>();

  return (
    <FilterContextProvider filterParams={['rule', 'status', 'component']}>
      <SecurityEnterpriseContractTab pipelineRun={pipelineRunName} />
    </FilterContextProvider>
  );
};
