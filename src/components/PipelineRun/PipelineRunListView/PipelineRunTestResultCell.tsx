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

  return (
    <TableData className={className}>
      <Popover
        triggerAction="hover"
        aria-label="error popover"
        bodyContent={testOutputNote}
        isVisible={testOutputNote ? undefined : false}
      >
        {isPipelineRunTestOutputResultLoading ? (
          <Spinner size="lg" />
        ) : (
          <div>{testOutputResult ? <StatusIconWithText status={testOutputResult} /> : '-'}</div>
        )}
      </Popover>
    </TableData>
  );
};

export default PipelineRunTestResultCell;
