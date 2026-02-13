import * as React from 'react';
import { PipelineRunKind } from '../../types';
import { FilterContextProvider } from '../Filter/generic/FilterContext';
import PipelineRunsListView from '../PipelineRun/PipelineRunListView/PipelineRunsListView';

type PipelineRunsTabProps = {
  applicationName: string;
  componentName?: string;
  branchName?: string;
  customFilter?: (plr: PipelineRunKind) => boolean;
};

const PipelineRunsTab: React.FC<React.PropsWithChildren<PipelineRunsTabProps>> = ({
  applicationName,
  componentName,
  branchName,
  customFilter,
}) => {
  return (
    <FilterContextProvider filterParams={['name', 'status', 'type']}>
      <PipelineRunsListView
        applicationName={applicationName}
        componentName={componentName}
        branchName={branchName}
        customFilter={customFilter}
      />
    </FilterContextProvider>
  );
};

export default PipelineRunsTab;
