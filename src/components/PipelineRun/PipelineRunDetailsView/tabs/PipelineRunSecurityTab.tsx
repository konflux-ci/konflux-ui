import * as React from 'react';
import { useParams } from 'react-router-dom';
import { FilterContextProvider } from '~/components/Filter/generic/FilterContext';
import { RouterParams } from '../../../../routes/utils';
import { SecurityConformaTab } from '../../../Conforma/SecurityConformaTab';

export const PipelineRunSecurityTab: React.FC = () => {
  const { pipelineRunName } = useParams<RouterParams>();

  return (
    <FilterContextProvider filterParams={['rule', 'status', 'component']}>
      <SecurityConformaTab pipelineRunName={pipelineRunName} />
    </FilterContextProvider>
  );
};
