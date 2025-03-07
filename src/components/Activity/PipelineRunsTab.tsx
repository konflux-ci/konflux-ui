import * as React from 'react';
import { PipelineRunKind } from '../../types';
import { PipelineRunsFilterContextProvider } from '../Filter/utils/PipelineRunsFilterContext';
import PipelineRunsListView from '../PipelineRun/PipelineRunListView/PipelineRunsListView';

type PipelineRunsTabProps = {
  applicationName: string;
  componentName?: string;
  customFilter?: (plr: PipelineRunKind) => boolean;
};

const PipelineRunsTab: React.FC<React.PropsWithChildren<PipelineRunsTabProps>> = ({
  applicationName,
  componentName,
  customFilter,
}) => {
  return (
    <PipelineRunsFilterContextProvider>
      <PipelineRunsListView
        applicationName={applicationName}
        componentName={componentName}
        customFilter={customFilter}
      />
    </PipelineRunsFilterContextProvider>
  );
};

export default PipelineRunsTab;
