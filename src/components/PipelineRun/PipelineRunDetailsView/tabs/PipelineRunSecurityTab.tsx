import * as React from 'react';
import { useParams } from 'react-router-dom';
import { FilterContextProvider } from '~/components/Filter/generic/FilterContext';
import { RouterParams } from '../../../../routes/utils';
import { SecurityConformaTab } from '../../../Conforma/SecurityConformaTab';
import { POLICY_EXCEPTION_FILTER_KEY } from '../../../Conforma/usePolicyExceptionFilter';

export const PipelineRunSecurityTab: React.FC = () => {
  const { pipelineRunName } = useParams<RouterParams>();

  return (
    <FilterContextProvider
      filterParams={['rule', 'status', 'component', POLICY_EXCEPTION_FILTER_KEY]}
    >
      <SecurityConformaTab pipelineRunName={pipelineRunName} />
    </FilterContextProvider>
  );
};
