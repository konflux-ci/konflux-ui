import { Popover, Spinner } from '@patternfly/react-core';
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
    !UNFINISHED_PLR_STATUSES.includes(status) && plr.status?.completionTime !== undefined;

  const [testOutputResult, isPipelineRunTestOutputResultLoading, testOutputNote] =
    usePipelineRunTestOutputResult(plr, shouldFetchTestResult ? namespace : undefined);

  const cellContent = isPipelineRunTestOutputResultLoading ? (
    <Spinner size="lg" />
  ) : (
    <>{testOutputResult ? <StatusIconWithText status={testOutputResult} /> : '-'}</>
  );

  return (
    <TableData className={className}>
      {testOutputNote ? (
        <Popover bodyContent={testOutputNote} aria-label="test output details">
          <span
            role="button"
            tabIndex={0}
            aria-label="test output details"
            style={{ cursor: 'pointer' }}
          >
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
