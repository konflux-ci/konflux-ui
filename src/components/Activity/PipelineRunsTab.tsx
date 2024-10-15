import * as React from 'react';
import { PipelineRunKind } from '../../types';
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
    <PipelineRunsListView
      applicationName={applicationName}
      componentName={componentName}
      customFilter={customFilter}
    />
  );
};

export default PipelineRunsTab;
