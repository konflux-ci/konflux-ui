import { Popover, Skeleton } from '@patternfly/react-core';
import { UNFINISHED_PLR_STATUSES } from '~/consts/pipelinerun';
import { usePipelineRunTestOutputResult } from '~/hooks/usePipelineRunTestOutputResult';
import { TableData } from '~/shared';
import { PipelineRunKind } from '~/types';
import { pipelineRunStatus } from '~/utils/pipeline-utils';
import { StatusIconWithText } from '../../topology/StatusIcon';

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

  const [testOutputResult, isPipelineRunTestOutputResultLoading, testOutputNote] =
    usePipelineRunTestOutputResult(shouldFetchTestResult ? namespace : null, plr);

  const cellContent = isPipelineRunTestOutputResultLoading ? (
    <Skeleton screenreaderText="Loading PipelineRun test output result" />
  ) : (
    <>{testOutputResult ? <StatusIconWithText status={testOutputResult} /> : '-'}</>
  );

  return (
    <TableData className={className}>
      {testOutputNote ? (
        <Popover bodyContent={testOutputNote} aria-label="test output details">
          <span role="button" aria-label="test output details" style={{ cursor: 'pointer' }}>
            {cellContent}
          </span>
        </Popover>
      ) : (
        cellContent
      )}
    </TableData>
  );
};

export default PipelineRunTestResultCell;
