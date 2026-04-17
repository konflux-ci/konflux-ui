import * as React from 'react';
import { Skeleton } from '@patternfly/react-core';
import { UNFINISHED_PLR_STATUSES } from '~/consts/pipelinerun';
import { usePipelineRunTestOutputResult } from '~/hooks/usePipelineRunTestOutputResult';
import { TableData } from '~/shared';
import { PipelineRunKind } from '~/types';
import { pipelineRunStatus } from '~/utils/pipeline-utils';
import { PipelineRunTestOutputResult } from './PipelineRunTestOutputResult';

type Props = {
  plr: PipelineRunKind;
  className: string;
  namespace?: string;
};

export const PipelineRunTestResultCell: React.FC<React.PropsWithChildren<Props>> = ({
  plr,
  namespace,
  className,
}) => {
  const status = pipelineRunStatus(plr);
  const shouldFetchTestResult =
    !!namespace &&
    !UNFINISHED_PLR_STATUSES.includes(status) &&
    plr.status?.completionTime !== undefined;

  const [aggregatedTestResult, isPipelineRunTestOutputResultLoading] =
    usePipelineRunTestOutputResult(shouldFetchTestResult ? namespace : null, plr);

  return (
    <TableData className={className}>
      {isPipelineRunTestOutputResultLoading ? (
        <Skeleton screenreaderText="Loading PipelineRun test output result" />
      ) : (
        <PipelineRunTestOutputResult aggregatedTestResult={aggregatedTestResult} />
      )}
    </TableData>
  );
};

export default PipelineRunTestResultCell;
