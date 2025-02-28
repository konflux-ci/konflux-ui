import React from 'react';
import { Link } from 'react-router-dom';
import { PipelineRunLabel } from '../../consts/pipelinerun';
import { RowFunctionArgs, TableData } from '../../shared/components/table';
import { Timestamp } from '../../shared/components/timestamp/Timestamp';
import { TaskRunKind } from '../../types/task-run';
import { taskName, taskRunStatus } from '../../utils/pipeline-utils';
import { StatusIconWithText } from '../topology/StatusIcon';
import { useWorkspaceInfo } from '../Workspace/useWorkspaceInfo';
import { taskRunTableColumnClasses } from './TaskRunListHeader';

const TaskRunListRow: React.FC<React.PropsWithChildren<RowFunctionArgs<TaskRunKind>>> = ({
  obj,
}) => {
  const { workspace } = useWorkspaceInfo();
  const applicationName = obj.metadata?.labels[PipelineRunLabel.APPLICATION];
  return (
    <>
      <TableData className={taskRunTableColumnClasses.name}>
        <Link
          to={`/workspaces/${workspace}/applications/${applicationName}/taskruns/${obj.metadata?.name}`}
          state={{
            recordpath: obj?.metadata?.annotations?.[PipelineRunLabel.PIPELINE_TEKTON_RECORD],
          }}
        >
          {obj.metadata.name}
        </Link>
      </TableData>
      <TableData className={taskRunTableColumnClasses.task}>{taskName(obj) ?? '-'}</TableData>
      <TableData className={taskRunTableColumnClasses.started}>
        <Timestamp timestamp={obj.status?.startTime} />
      </TableData>
      <TableData className={taskRunTableColumnClasses.status}>
        <StatusIconWithText dataTestAttribute="taskrun-status" status={taskRunStatus(obj)} />
      </TableData>
      <TableData className={taskRunTableColumnClasses.kebab}> </TableData>
    </>
  );
};

export default TaskRunListRow;
