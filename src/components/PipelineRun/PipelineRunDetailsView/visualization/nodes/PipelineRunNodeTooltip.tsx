import * as React from 'react';
import Duration from '~/shared/components/duration/Duration';
import { ColoredStatusIcon } from '../../../../topology/StatusIcon';
import { StepStatus } from '../types';

type PipelineRunNodeTooltipProps = {
  label: string;
  description?: string;
  steps?: StepStatus[];
};

const PipelineRunNodeTooltip: React.FunctionComponent<
  React.PropsWithChildren<PipelineRunNodeTooltipProps>
> = ({ label, steps }) => (
  <div className="pipelinerun-node__tooltip--content" data-test="pipeline-run-tip">
    <div className="pipelinerun-node__tooltip--title">{label}</div>
    {steps?.map((step) => (
      <div key={step.name} className="pipelinerun-node__tooltip--step">
        <div className="pipelinerun-node__tooltip--step-icon">
          <ColoredStatusIcon status={step.status} />
        </div>
        <div className="pipelinerun-node__tooltip--step-name">{step.name}</div>
        <div>
          <Duration startTime={step.startTime} endTime={step.endTime} />
        </div>
      </div>
    ))}
  </div>
);

export default PipelineRunNodeTooltip;
