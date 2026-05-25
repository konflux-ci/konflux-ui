import { Truncate } from '@patternfly/react-core';
import { StatusIconWithText } from '~/components/StatusIcon/StatusIcon';
import { runStatus } from '~/consts/pipelinerun';
import { TableData, Timestamp } from '~/shared';
import { Duration } from '~/shared/components/duration';
import { PipelineRunKind } from '~/types';
import { pipelineRunStatus } from '~/utils/pipeline-utils';
import { dependencyRunTableColumnClasses } from './DependencyRunsListHeader';

type DependencyRunListRowProps = {
  obj: PipelineRunKind;
};

export const DependencyRunsListRow = ({ obj }: DependencyRunListRowProps) => {
  const status = pipelineRunStatus(obj);

  return (
    <>
      <TableData data-test="dependency-run-name" className={dependencyRunTableColumnClasses.name}>
        <Truncate content={obj.metadata?.name ?? ''} />
      </TableData>
      <TableData
        data-test="dependency-run-started"
        className={dependencyRunTableColumnClasses.started}
      >
        <Timestamp timestamp={obj.status?.startTime ?? ''} />
      </TableData>
      <TableData
        data-test="dependency-run-duration"
        className={dependencyRunTableColumnClasses.duration}
      >
        {status !== runStatus.Pending ? (
          <Duration startTime={obj.status?.startTime} endTime={obj.status?.completionTime} />
        ) : (
          '-'
        )}
      </TableData>
      <TableData
        data-test="dependency-run-status"
        className={dependencyRunTableColumnClasses.status}
      >
        <StatusIconWithText status={status} />
      </TableData>
    </>
  );
};
