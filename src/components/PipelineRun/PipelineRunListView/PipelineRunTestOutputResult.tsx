import * as React from 'react';
import { ColoredStatusIcon } from '~/components/topology/StatusIcon';
import { runStatus } from '~/consts/pipelinerun';
import { AggregatedTestResult } from '~/hooks/usePipelineRunTestOutputResult';

import './PipelineRunTestOutputResult.scss';

const TestResultCounterWithStatus: React.FC<{
  count: number;
  status: runStatus;
  label: string;
}> = ({ count, status, label }) => {
  return (
    <div className="test-result-cell__result" aria-label={`${count} ${label}`}>
      <ColoredStatusIcon status={status} />
      <span className="test-result-cell__result-count">{count}</span>
    </div>
  );
};

export const PipelineRunTestOutputResult: React.FC<{
  aggregatedTestResult: AggregatedTestResult | null;
}> = ({ aggregatedTestResult }) => {
  if (!aggregatedTestResult) {
    return '-';
  }

  return (
    <div className="test-result-cell">
      <TestResultCounterWithStatus
        status={runStatus.Failed}
        count={aggregatedTestResult.failures}
        label={aggregatedTestResult.failures === 1 ? 'failure' : 'failures'}
      />
      <TestResultCounterWithStatus
        status={runStatus.TestWarning}
        count={aggregatedTestResult.warnings}
        label={aggregatedTestResult.warnings === 1 ? 'warning' : 'warnings'}
      />
      <TestResultCounterWithStatus
        status={runStatus.Succeeded}
        count={aggregatedTestResult.successes}
        label={aggregatedTestResult.successes === 1 ? 'success' : 'successes'}
      />
    </div>
  );
};
